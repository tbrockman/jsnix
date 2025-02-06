import type * as monacoTypes from 'monaco-editor';
import { JsnixWebContainer } from './container';
import { Disposable, Emitter } from '@jsnix/xterm';

// TODO: make this extend regular monaco-editor
export class Editor extends Disposable {
	#monaco: monacoTypes.editor.IStandaloneCodeEditor;
	#container: JsnixWebContainer;
	#monacoLib: typeof monacoTypes;
	#isOpen: boolean;

	private readonly _onClose = this._register(new Emitter<{ uri?: string }>());
	public readonly onClose = this._onClose.event;

	private readonly _onSave = this._register(new Emitter<{ uri: string }>());
	public readonly onSave = this._onSave.event;

	private readonly _onOpen = this._register(new Emitter<{ uri: string }>());
	public readonly onOpen = this._onOpen.event;

	get instance() {
		return this.#monaco;
	}

	constructor(
		monaco: monacoTypes.editor.IStandaloneCodeEditor,
		monacoLib: typeof monacoTypes,
		container: JsnixWebContainer,
		open: boolean = false,
	) {
		super();
		this.#monaco = monaco;
		this.#monacoLib = monacoLib;
		this.#container = container;
		this.#isOpen = open;

		// onOpen and onClose logic
		this._register(this.#monaco.onDidChangeModel((e) => {
			console.debug({ msg: 'monaco.onDidChangeModel', ...e })
			if (e.newModelUrl && e.newModelUrl.path !== e.oldModelUrl?.path) {
				this.#isOpen = true;
				this._onOpen.fire({ uri: e.newModelUrl.path });
			}
			else if (!e.newModelUrl && e.oldModelUrl) {
				this.#isOpen = false;
				this._onClose.fire({ uri: e.oldModelUrl?.path });
			}
		}));
	}

	async open(path: string, cwd?: string) {
		path = this.#container.fs.resolve(path, cwd);
		const uri = this.#monacoLib.Uri.file(path);
		const existing = this.#monacoLib.editor.getModel(uri);
		if (existing) {
			return this.#monaco.setModel(existing);
		}
		// Check if the file exists in the container's file system
		try {
			const file = await this.#container.fs.readFile(path, 'utf8');
			const model = this.#monacoLib.editor.createModel(
				file,
				undefined,
				uri,
			);
			return this.#monaco.setModel(model);
		}
		catch (error) {
			// @ts-ignore
			if (error.toString().indexOf('ENOENT') > -1) {
				// File does not exist, create a new model
				const model = this.#monacoLib.editor.createModel('', undefined, uri);
				return this.#monaco.setModel(model);
			}
			throw error;
		}
	}

	async close() {
		this.#monaco.setModel(null);
	}

	async save() {
		const model = this.#monaco.getModel();
		if (model) {
			const value = this.#monaco.getValue();
			await this.#container.fs.writeFile(model.uri.path, new TextEncoder().encode(value));
			this._onSave.fire({ uri: model.uri.path });
		}
	}

	addDefaultCommands() {
		this.#monaco.addCommand(this.#monacoLib.KeyMod.CtrlCmd | this.#monacoLib.KeyCode.KeyS, async () => await this.save());
		this.#monaco.addCommand(this.#monacoLib.KeyMod.CtrlCmd | this.#monacoLib.KeyCode.KeyQ, async () => await this.close());
	}

	get isOpen(): boolean {
		return this.#isOpen;
	}

	focus(options: FocusOptions = { preventScroll: true }) {
		this.#monaco.getDomNode()?.querySelector<HTMLTextAreaElement>('.inputarea.monaco-mouse-cursor-text')?.focus(options);
	}
}
