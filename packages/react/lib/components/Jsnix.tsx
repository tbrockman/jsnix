import type { IDisposable, ITerminalInitOnlyOptions, ITerminalOptions } from '@jsnix/xterm';
import { useEffect, useRef, useState } from 'react';
import { SpawnOptions, Unsubscribe, WebContainer, WebContainerProcess } from '@webcontainer/api';
import chalk from 'chalk';
chalk.level = 3;
import useTerminal from '../hooks/useTerminal.js';
import { JsnixTerminal } from '@jsnix/utils/terminal';
import useEditor from '../hooks/useEditor.js';
import useWebContainer from '../hooks/useWebContainer';
import { WrappedJsnixExports, WrappedOscData } from '@jsnix/utils/osc';
import { dots, Spinner } from '@jsnix/utils/spinner';
import { link } from '@jsnix/utils/escapes';
import { serializeRequest, deserializeResponse } from '@jsnix/utils/ipc';
import { RelayRequestInit } from '@jsnix/utils/types';
import { readJSONChunks } from '@jsnix/utils/ipc';
import { Mutex } from 'async-mutex';
import type * as monaco from 'monaco-editor';

// import 'dockview-core/dist/styles/dockview.css';
import '@jsnix/xterm/css/xterm.css';
import './Jsnix.css';
import { FsOrFsFunction } from '@jsnix/utils/container';
import { promiseWithTimeout } from '@jsnix/utils/promises';

export type JsnixOptions = {
	/**
	 * The entrypoint command to use when booting the webcontainer
	 */
	entrypoint?: string[];
	/**
	 * Additional environment variables to set in the webcontainer
	 */
	env?: Record<string, string>;
	/**
	 * The prompt to display in the terminal before loading any necessary resources
	 */
	prompt?: string | string[] | false;
	/**
	 * The welcome message to display at the top of the terminal when it boots
	 */
	banner?: string;
	/**
	 * An array of commands to bootstrap the webcontainer with
	 */
	bootstrap?: BootstrapCommand[];
	/**
	 * An array of additional information (`JsnixExports`) for automatically registering OSC handlers and binary aliases
	 */
	jsnixExports?: WrappedJsnixExports[];
	/**
	 * The mount point to use when attaching the received filesystem
	 */
	mountPoint?: string;
	/**
	 * The name of the workdir to use when booting the webcontainer
	 */
	workdirName?: string;
	/**
	 * Path (relative to the specified filesystem) where global NPM binaries should be installed
	 *
	 * default: `{mountPoint}/bin`
	 */
	globalInstallDir?: string;
	/**
	 * Options to forward to the attached Xterm.js terminal
	 */
	terminalOptions?: (ITerminalOptions & ITerminalInitOnlyOptions);
	/**
	 * Options to forward to the attached monaco-editor editor
	 */
	editorOptions?: monaco.editor.IStandaloneEditorConstructionOptions;
	/**
	 * Called when the component is ready
	 *
	 * @param container the ready webcontainer
	 * @param terminal the connected xterm.js terminal
	 * @returns
	 */
	onSetup?: (container: WebContainer, terminal: JsnixTerminal) => void;
	/**
	 * Called when the component resources are being cleaned up
	 */
	onTeardown?: () => void;
	/**
	 * Called whenever a process in the WebContainer opens a port
	 */
	onPort?: (port: number) => Promise<void> | void;
};

export type JsnixProps = {
	fs: FsOrFsFunction;
	options?: JsnixOptions;
};

export type DevServer = {
	port: number;
	url: string;
};

export type BoostrapOptions = SpawnOptions & {
	detached?: boolean;
};

export type BootstrapCommand = {
	cmd: string[];
	options?: BoostrapOptions;
};

// TODO: animation on "start" here
const prompt = `press any key to ${chalk.greenBright('start')}`;
const banner = `${chalk.magenta(link('jsnix', 'https://github.com/tbrockman/jsnix'))} ${chalk.dim(`(v${APP_VERSION})`)}`;
const necessaryEnv = {
	// important, as OSC 8 hyperlink support detection in ink-link doesn't work for webcontainers
	// see: https://github.com/jamestalmage/supports-hyperlinks/blob/master/index.js#L32
	FORCE_HYPERLINK: 1,
	WEBCONTAINER: true,
	USER_AGENT: navigator?.userAgent.toLowerCase(),
};
const defaultOptions: JsnixOptions = {
	entrypoint: ['jsh'],
	prompt,
	banner,
	jsnixExports: [],
	mountPoint: '/',
	globalInstallDir: '/bin',
	workdirName: 'workspace',
	env: {},
	terminalOptions: { logLevel: 'warn' },
	onSetup: () => { },
	onPort: async () => { },
	onTeardown: () => { },
};
const note = `
${chalk.yellow('note:')}
${chalk.white('a bug in one of my dependencies (which can be fixed by reloading the page) may cause random freezes. sorry ☹️')}
`;

let relayProcess: WebContainerProcess | null = null;
let sharedWriter: WritableStreamDefaultWriter;
let sharedReader: ReadableStreamDefaultReader;
const mutex = new Mutex();

// TODO: probably replace most initialization with fs mounts?
export default function Jsnix({ fs, options }: JsnixProps) {
	const { entrypoint, prompt, banner, bootstrap, jsnixExports, globalInstallDir, mountPoint, workdirName, env, terminalOptions, editorOptions, onSetup, onTeardown } = { ...defaultOptions, ...options };
	const { init: initContainer, container } = useWebContainer({ fs, mountPoint, bootOptions: { workdirName }, onTeardown });
	const termRef = useRef(null);
	const editorRef = useRef(null);
	const jsnixRef = useRef<HTMLDivElement>(null);
	const [devServer, setDevServer] = useState<DevServer | null>(null);
	const [currentProcess, setCurrentProcess] = useState<WebContainerProcess | null>(null);
	const { editor, init: initEditor } = useEditor({ ref: editorRef, parentRef: jsnixRef, container: container, options: editorOptions });
	const { terminal } = useTerminal({ process: currentProcess, ref: termRef, container: container, editor, options: terminalOptions });
	const [termReady, setTermReady] = useState(false);

	const getRelay = async (): Promise<WebContainerProcess | null> => {
		try {
			if (relayProcess) {
				return relayProcess;
			}

			if (!container) {
				console.warn('Can\'t start relay, container is null');
				return null;
			}

			const process = await container.spawn('npm', ['install', '@jsnix/relay'], {
				cwd: globalInstallDir,
			});
			await process?.exit;

			const proc = await container.spawn('node', ['node_modules/@jsnix/relay/dist/relay/main.js'], {
				cwd: globalInstallDir,
				output: true,
			});
			sharedWriter = proc.input?.getWriter();
			sharedReader = proc.output?.getReader();
			// TODO: technically should check that this is a ready message
			const { value, done } = await sharedReader.read();
			console.debug({ msg: 'received relay start message', value, done });
			relayProcess = proc;
		}
		catch (err) {
			console.error('relay error', err);
		}
		return relayProcess;
	};

	const relayFetch = (url: string) => {
		return async (req: RelayRequestInit) => {
			const release = await mutex.acquire();
			const response: Response | null = null;

			try {
				const relay = await getRelay();

				if (!relay) {
					throw new Error('Container relay unavailable, can\'t fetch');
				}

				req.headers = {
					...req.headers,
					'Relay-Request-Id': window.crypto.randomUUID(),
					'Relay-Request-Origin': 'client',
				} as Record<string, string>;
				const serialized = await serializeRequest({ ...req, url });
				await sharedWriter.ready;
				await sharedWriter.write(serialized + '\r');

				for await (const json of readJSONChunks(sharedReader, !import.meta.env.PROD, 'client')) {
					const { type, ...remainder } = json;

					if (type === 'response') {
						console.debug({ msg: 'response received', type, data: remainder });
						return await deserializeResponse(remainder);
					}
					else {
						console.debug({ msg: 'unhandled message received', type, data: remainder });
					}
				}
			}
			catch (error) {
				console.error(error);
			}
			finally {
				release();
			}
			return response || null;
		};
	};

	const createBinAlias = async (bin: string, alias: string) => {
		if (!container) {
			console.warn('webcontainer is unavailable, can\'t create binary aliases');
			return;
		}
		const proc = await container.spawn('jsh', ['--exec', `echo "alias ${alias}='${bin}'" >> ~/.jshrc`], { cwd: '/' });
		await proc.exit;
	};

	useEffect(() => {
		const unsubs: Unsubscribe[] = [];

		if (container) {
			const ready = container?.on('server-ready', async (port: number, url: string) => {
				console.debug({ msg: 'server-ready', port, url });

				if (port === 5173) {
					setDevServer({ port, url });
				}

				jsnixExports?.forEach(async (e) => {
					if (e.onServerReady) {
						try {
							await e.onServerReady({ container, port, url, fetch: relayFetch(url), editor, terminal, initEditor });
						}
						catch (error) {
							console.error(error);
						}
					}
				});
			});

			const port = container?.on('port', async (port: number, type: 'open' | 'close', url: string) => {
				console.debug({ msg: 'port', type, port, url });

				if (port === 5173 && type === 'close') {
					setDevServer(null);
				}

				jsnixExports?.forEach(async (e) => {
					if (e.onPort) {
						try {
							await e.onPort({ port, url, type, container, fetch: relayFetch(url), editor, terminal, initEditor });
						}
						catch (error) {
							console.error(error);
						}
					}
				});
			});

			unsubs.push(ready, port);
		}
		return () => {
			unsubs.forEach((unsub) => unsub());
		};
	}, [jsnixExports, container, editor, terminal]);

	// Handler for initial prompt to start the webcontainer
	useEffect(() => {
		let listener: IDisposable | undefined;

		if (termReady && terminal && !container) {
			if (prompt) {
				if (typeof prompt === 'string') {
					terminal.writeln(prompt);
				}
				else {
					prompt.forEach((p) => terminal.writeln(p));
				}
				listener = terminal.onKey(async () => {
					if (!container) {
						listener?.dispose();
						listener = undefined;
						await setupContainer(terminal);
					}
				});
			}
			else {
				setupContainer(terminal);
			}
		}
		return () => {
			listener && listener.dispose();
		};
	}, [termReady, terminal, container]);

	const createCommandAliases = async () => {
		console.debug({ msg: 'creating command aliases', jsnixExports });

		const promises = jsnixExports?.filter((e) => e.name && e.bin).map(async (exported) => {
			await Promise.all(
				exported.bin?.map(
					async (bin) => await createBinAlias(`jsnix ${exported.name}`, bin),
				) || [],
			);
		}) || [];
		await Promise.all(promises);
		console.debug({ msg: 'created command aliases', promises });
	};

	useEffect(() => {
		if (container) {
			createCommandAliases();
		}
	}, [container, jsnixExports]);

	useEffect(() => {
		const disposables: IDisposable[] = [];

		if (terminal) {
			jsnixExports?.filter((e) => !!e.osc)?.map((e) => e.osc as WrappedOscData).forEach(({ id, handler }) => {
				if (!id || !handler) return;
				console.debug({ msg: 'registering osc handler', id, handler });
				const d = terminal.parser.registerOscHandler(id, async (data) => handler({ data, container, process: currentProcess, terminal, document, editor, initEditor }));
				disposables.push(d);
			});
			setTermReady(true);
		}

		return () => {
			disposables.forEach((d) => d.dispose());
		};
	}, [jsnixExports, container, currentProcess, terminal, document, editor]);

	const setupContainer = async (terminal: JsnixTerminal) => {
		note && terminal.writeln(note);
		const stream = terminal.getWritableStream();

		const spinner = new Spinner({
			text: 'preparing webcontainer',
			stream,
			...dots,
		});
		spinner.start();

		await promiseWithTimeout<void>(async (resolve, reject) => {
			try {
				const container = await initContainer(spinner);

				if (bootstrap) {
					const child = spinner.addChild({
						text: 'bootstrapping webcontainer',
						...dots,
					});
					child.start();

					for (const { cmd, options } of bootstrap) {
						if (cmd && cmd.length > 0) {
							const [command, ...args] = cmd;
							const { detached, ...spawnOptions } = options || {};
							const process = await container.spawn(command!, args, spawnOptions);
							// if output isn't suppressed, pipe it to terminal
							// TODO: make this compatible with the spinners
							const dispose = !spawnOptions?.output ? null : await pipeToTerminal(process, terminal);
							!detached && await process.exit;
							await dispose?.();
						}
					}
					await child.stop(`${chalk.green('✔')} bootstrap complete`);
				}
				await spinner.stop(`${chalk.green('✔')} webcontainer started`);
				await stream.close();

				terminal.write('\x1bc'); // terminal clear sequence
				banner && terminal.writeln(banner);

				if (entrypoint) {
					const entryProcess = await start(entrypoint, container, terminal);
					const dispose = await pipeToTerminal(entryProcess, terminal);
					entryProcess && setCurrentProcess(entryProcess);
					entryProcess?.exit.then(async () => await dispose?.());
				}
				onSetup && onSetup(container, terminal);
				resolve();
			} catch (err) {
				reject(err)
			}
		}, 5 * 60 * 1000).catch(async (err) => {
			// TODO: better exception/timeout handling
			if (spinner.isRunning) {
				await spinner.stop(`${chalk.red('✖')} webcontainer start failed`);
			}
			terminal.writeln(err.toString())
		})
	};

	const start = async (entrypoint: string[], container: WebContainer, term: JsnixTerminal) => {
		const [cmd, ...args] = entrypoint;

		const entryProcess = await container.spawn(cmd!, args, {
			terminal: {
				cols: term.cols,
				rows: term.rows,
			},
			env: {
				...necessaryEnv,
				...env,
			},
		});

		entryProcess.exit.then(async (exitCode) => {
			console.debug({ msg: 'entry process exited', cmd, args, exitCode, entryProcess });

			if (entrypoint.pop() !== 'jsh') {
				// write the previous command to the histfile
				await container.spawn('jsh', ['-c', `echo "${cmd}${args.length > 0 ? ' ' + args.join(' ') : ''}" >> /home/.jsh_history`])
				// spawn the `jsh` shell as the next process by default
				const proc = await container.spawn('jsh', [], {
					terminal: {
						cols: term.cols,
						rows: term.rows,
					},
					env: {
						...necessaryEnv,
						...env,
					},
				});
				pipeToTerminal(proc, term);
				setCurrentProcess(proc);
			}
		});
		return entryProcess;
	};

	const pipeToTerminal = async (process: WebContainerProcess, terminal: JsnixTerminal) => {
		process?.output.pipeTo(
			new WritableStream({
				write: (chunk) => {
					terminal.write(chunk);
				},
			}),
		);
		const input = process?.input.getWriter();
		await input.ready;
		terminal.process = { input };

		const disposable = terminal.onData((data: any) => {
			input?.write(data);
		});
		return async () => {
			disposable.dispose();
			await input.close();
		};
	};

	const touchStartY = useRef(0);
	const touchEndY = useRef(0);
	const touchStartTime = useRef(0);

	useEffect(() => {
		const container = jsnixRef.current;

		if (!container) return;

		const handleTouchStart = (e: TouchEvent) => {
			touchStartY.current = e.touches[0].clientY;
			touchStartTime.current = e.timeStamp;
		};

		const handleTouchEnd = (e: TouchEvent) => {
			touchEndY.current = e.changedTouches[0].clientY;
			const touchEndTime = e.timeStamp;

			const deltaY = touchEndY.current - touchStartY.current;
			const deltaTime = touchEndTime - touchStartTime.current;

			const velocity = Math.abs(deltaY / deltaTime);

			const thresholdVelocity = 0.5; // Adjust threshold as needed
			const thresholdDistance = 50; // Minimum distance for a valid swipe

			// Get the target child element
			const target = e.target as HTMLElement;

			// If the target is scrollable and the user is not at its boundaries
			const isScrollable = target.scrollHeight > target.clientHeight;
			const isAtTop = target.scrollTop === 0;
			const isAtBottom
				= target.scrollTop + target.clientHeight >= target.scrollHeight;

			if (
				isScrollable
				&& !(
					(deltaY < 0 && isAtTop) // Scrolling up at the top
					|| (deltaY > 0 && isAtBottom) // Scrolling down at the bottom
				)
			) {
				// Allow inner scrolling
				return;
			}

			// Handle high-velocity swipes for parent container
			if (velocity > thresholdVelocity && Math.abs(deltaY) > thresholdDistance) {
				const isSwipeUp = deltaY < 0;

				const scrollStep = container.offsetHeight;
				container.scrollBy({
					top: isSwipeUp ? scrollStep : -scrollStep,
					behavior: 'smooth',
				});
			}
		};

		container.addEventListener('touchstart', handleTouchStart);
		container.addEventListener('touchend', handleTouchEnd);

		return () => {
			container.removeEventListener('touchstart', handleTouchStart);
			container.removeEventListener('touchend', handleTouchEnd);
		};
	}, []);

	// TODO: refactor to allow multiple terminals/editors/etc. ("processes")
	return (
		<div ref={jsnixRef} className="jsnix-container">
			<div className={`jsnix-editor-container jsnix-window`}>
				<div ref={editorRef} className="jsnix-editor" />
			</div>
			<div ref={termRef} className={`jsnix-terminal-container jsnix-window`}></div>
			{devServer && <iframe className={`jsnix-terminal-preview jsnix-window loaded`} src={devServer.url}></iframe>}
		</div>
	);
}
