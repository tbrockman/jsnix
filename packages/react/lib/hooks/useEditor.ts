import React, { useEffect, useState } from 'react';
import type { JsnixWebContainer } from '@jsnix/utils/container';
import { Editor } from '@jsnix/utils/editor';
import type * as monaco from 'monaco-editor';

export type UseEditorProps = {
	ref: React.RefObject<HTMLDivElement>;
	parentRef?: React.RefObject<HTMLDivElement>;
	container: JsnixWebContainer | null;
	options?: monaco.editor.IStandaloneEditorConstructionOptions;
}

export default function useEditor({ ref, parentRef, container, options }: UseEditorProps) {
	const [_monaco, setMonaco] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
	const [monacoLib, setMonacoLib] = useState<typeof monaco | null>(null);
	const [editor, setEditor] = useState<Editor | null>(null);

	useEffect(() => {
		const onResize = () => {
			if (_monaco) {
				_monaco.layout(undefined, true);
			}
		};

		window.addEventListener('resize', onResize);

		return () => {
			window.removeEventListener('resize', onResize);
			_monaco?.dispose();
		};
	}, [_monaco, ref.current]);

	useEffect(() => {
		const disposable = editor?.onOpen(async () => {

			if (!ref.current) {
				return;
			}
			ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
			editor.focus();
		});

		return () => {
			disposable?.dispose();
		};
	}, [editor, parentRef, ref]);

	// TODO: maybe don't make this called explicitly, just do it lazily when necessary
	const init = async (): Promise<{ monaco: monaco.editor.IStandaloneCodeEditor; editor: Editor }> => {
		// dynamically import monaco to improve load time unless someone actually uses the editor
		const monacoLib: typeof monaco = await import('monaco-editor');
		monacoLib.languages.typescript.typescriptDefaults.setCompilerOptions({
			jsx: monacoLib.languages.typescript.JsxEmit.React,
		});
		monacoLib.editor.defineTheme('jsnix', {
			base: 'vs-dark',
			inherit: true,
			rules: [],
			colors: {
				'editor.background': '#1a1a1a',
			},
		});
		const monacoEditor = monacoLib.editor.create(ref.current!, {
			minimap: { enabled: false },
			automaticLayout: true,
			fixedOverflowWidgets: true,
			overflowWidgetsDomNode: document.body,
			scrollBeyondLastLine: false,
			theme: 'jsnix',
			wordWrap: 'on',
			fontSize: 15,
			...options,
		});

		const body = document.querySelector('body');

		if (body && !body.classList.contains('monaco-editor')) {
			body.classList.add('monaco-editor');
		}

		const editor = new Editor(monacoEditor, monacoLib, container!);
		editor.addDefaultCommands();

		setMonaco(monacoEditor);
		setMonacoLib(monacoLib);
		setEditor(editor);
		return { monaco: _monaco!, editor };
	};

	return { monacoLib, editor, init };
}
