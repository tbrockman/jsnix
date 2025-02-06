import React, { useEffect, useState } from 'react';
import type { ITerminalInitOnlyOptions, ITerminalOptions } from '@jsnix/xterm';
import { FitAddon } from '@jsnix/addon-fit';
import { ClipboardAddon } from '@xterm/addon-clipboard';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { UnicodeGraphemesAddon } from '@jsnix/addon-unicode-graphemes';
import type { WebContainer, WebContainerProcess } from '@webcontainer/api';
import { JsnixTerminal } from '@jsnix/utils/terminal';
import type { Editor } from '@jsnix/utils/editor';

const defaultOptions: ITerminalOptions = {
	cursorBlink: true,
	allowProposedApi: true,
	screenReaderMode: true,
	fontFamily: 'Emoji, Consolas, Menlo, Monaco, "Lucida Console", "Liberation Mono", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Courier New", monospace, serif',
	convertEol: true,
	theme: {
		foreground: '#f8f8f2',
		background: '#252525',
		cursor: '#bbbbbb',

		black: '#000000',
		brightBlack: '#555555',

		red: '#ff5555',
		brightRed: '#ff5555',

		green: '#50fa7b',
		brightGreen: '#50fa7b',

		yellow: '#f1fa8c',
		brightYellow: '#f1fa8c',

		blue: '#bd93f9',
		brightBlue: '#bd93f9',

		magenta: '#fe5858',
		brightMagenta: '#feae58',

		cyan: '#8be9fd',
		brightCyan: '#8be9fd',

		white: '#bbbbbb',
		brightWhite: '#ffffff',
	},
};

export type UseTerminalProps = {
	ref: React.RefObject<HTMLDivElement>;
	process: WebContainerProcess | null;
	container: WebContainer | null;
	editor: Editor | null;
	options?: (ITerminalOptions & ITerminalInitOnlyOptions);
};

export default function useTerminal({ ref, process, options }: UseTerminalProps) {
	const [terminal, setTerminal] = useState<JsnixTerminal | null>(null);
	const [fitAddon, setFitAddon] = useState<FitAddon | null>(null);

	useEffect(() => {
		const onResize = async () => {
			if (!terminal || !fitAddon) return;

			await new Promise((resolve) => window.requestAnimationFrame(resolve));

			fitAddon?.fit();
			if (process) {
				process.resize({ cols: terminal.cols, rows: terminal.rows });
			}
		};

		// Use ResizeObserver to watch for parent container size changes
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.target === ref.current) {
					onResize();
				}
			}
		});

		if (ref.current) {
			resizeObserver.observe(ref.current);
		}

		// Cleanup ResizeObserver and window event listener
		return () => {
			if (ref.current) {
				resizeObserver.unobserve(ref.current);
			}
			resizeObserver.disconnect();
		};
	}, [ref, terminal, process, fitAddon]);

	useEffect(() => {
		let term: JsnixTerminal | null = null;

		if (ref.current && !terminal) {
			options = {
				...defaultOptions,
				...options,
				logger: {
					trace: console.trace,
					debug: console.debug,
					info: (...args: any[]) => {
						console.info(...args);
						term?.printBuffer();
					},
					warn: console.warn,
					error: console.error,
				},
			};
			term = new JsnixTerminal(options);
			term.attachCustomKeyEventHandler((arg) => {
				if (arg.ctrlKey && arg.code === 'KeyC' && arg.type === 'keydown') {
					const selection = term!.getSelection();

					if (selection) {
						navigator.clipboard.writeText(selection);
						return false;
					}
				}

				if (arg.ctrlKey && arg.code === 'KeyV' && arg.type === 'keydown') {
					return false;
				};
				return true;
			});

			const fit = new FitAddon();
			term.loadAddon(fit);
			term.loadAddon(new ClipboardAddon());
			term.loadAddon(new WebLinksAddon());
			term.loadAddon(new UnicodeGraphemesAddon());
			term.open(ref.current);
			fit.fit();

			// Not sure why viewport has a different background color other than what's specified but...
			const viewport = ref.current.querySelector<HTMLElement>('.xterm-viewport');
			if (viewport && options.theme?.background) {
				viewport.style.backgroundColor = options.theme.background;
			}
			setTerminal(term);
			setFitAddon(fit);
			requestAnimationFrame(() => {
				setTimeout(() => term?.focus(), 0);
			});
		}

		return () => {
			term?.dispose();
			setTerminal(null);
		};
	}, [ref]);

	return { terminal, setTerminal };
}
