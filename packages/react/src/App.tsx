import { useEffect, useState } from 'react';
import Jsnix, { JsnixOptions } from '../lib/components/Jsnix.js';
import { loadJsnixExports, WrappedJsnixExports } from '@jsnix/utils/osc';
import chalk from 'chalk';


import JSONWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import CSSWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HTMLWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import TSWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

export type WorkerName = string;
const workers = {} as Record<WorkerName, Worker>;
const getWorker = (label: string) => {
	switch (label) {
		case 'json': return new JSONWorker();
		case 'scss':
		case 'less':
		case 'css': return new CSSWorker();
		case 'html':
		case 'handlebars':
		case 'razor': return new HTMLWorker()
		case 'typescript':
		case 'javascript': return new TSWorker()
		default: return new EditorWorker()
	}
};

self.MonacoEnvironment = {
	getWorker: function (_, label) {
		if (label in workers) {
			return workers[label];
		}
		const worker = getWorker(label);
		workers[label] = worker;
		return worker;
	},
};

function App() {
	const [jsnixExports, setJsnixExports] = useState<WrappedJsnixExports[] | undefined>(undefined);
	const options: JsnixOptions = {
		env: {
			PATH: '/home/workspace/bin:/bin:/usr/bin:/usr/local/bin',
			NODE_OPTIONS: '--no-warnings --experimental-global-webcrypto',
		},
		prompt: [
			`\x1b]80085;data;152c8668-1bb3-4fa9-9639-6bce2a57a798;eyJodG1sIjoiPGRpdiBzdHlsZT1cIndpZHRoOiAxMDAlO1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRib3gtc2l6aW5nOiBib3JkZXItYm94O1xuXHRqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcblx0cGFkZGluZzogMXJlbTtcIj5cblx0PGRpdiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6ICMzODM4Mzg7XG5cdFx0XHRcdGJveC1zaGFkb3c6IC0xcmVtIDFyZW0gIzE3MTcxNztcblx0XHRcdFx0cGFkZGluZzogMXJlbTtcblx0XHRcdFx0cGFkZGluZy1ib3R0b206IDJyZW07XG5cdFx0XHRcdHdoaXRlLXNwYWNlOiBwcmUtd3JhcDtcblx0XHRcdFx0Zm9udC1zaXplOiBjbGFtcCg2cHgsIGNhbGMoMTAwdncgLyAzNCksIDE2cHgpO1xuXHRcdFx0XHRmb250LWZhbWlseTogbW9ub3NwYWNlO1xuXHRcdFx0XHRjb2xvcjogd2hpdGU7XG5cdFx0XHRcdGJvcmRlcjogNHB4IHNvbGlkICMwYTBhMGE7XG5cdFx0XHRcdHdpZHRoOiAxMDAlO1xuXHRcdFx0XHRkaXNwbGF5OiBmbGV4O1xuXHRcdFx0XHRib3gtc2l6aW5nOiBib3JkZXItYm94O1xuXHRcdFx0XHRqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcblx0XHRcdFx0YWxpZ24taXRlbXM6IGZsZXgtc3RhcnQ7XG5cdFx0XHRcdGxpbmUtaGVpZ2h0OiBpbml0aWFsO1wiPlxu4paI4paI4paI4paI4paI4paI4paI4paI4pWX4paI4paI4pWXICDilojilojilZfilojilojilojilojilojilojilojilZcg4paI4paI4paI4paI4paI4paI4pWXIFxu4pWa4pWQ4pWQ4paI4paI4pWU4pWQ4pWQ4pWd4paI4paI4pWRICDilojilojilZHilojilojilZTilZDilZDilZDilZDilZ3ilojilojilZTilZDilZDilZDilojilojilZdcbiAgIOKWiOKWiOKVkSAgIOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKVkeKWiOKWiOKWiOKWiOKWiOKVlyAg4paI4paI4pWRICAg4paI4paI4pWRXG4gICDilojilojilZEgICDilojilojilZTilZDilZDilojilojilZHilojilojilZTilZDilZDilZ0gIOKWiOKWiOKVkSAgIOKWiOKWiOKVkVxuICAg4paI4paI4pWRICAg4paI4paI4pWRICDilojilojilZHilojilojilojilojilojilojilojilZfilZrilojilojilojilojilojilojilZTilZ1cbiAgIOKVmuKVkOKVnSAgIOKVmuKVkOKVnSAg4pWa4pWQ4pWd4pWa4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWdIOKVmuKVkOKVkOKVkOKVkOKVkOKVnVxuXG5cbiAgICAgZGV2IPCfkrsgYXJ0aXN0IPCfjqggZ29vZiDwn6ShXG48L2Rpdj48L2Rpdj4ifQ==\x07`,
			'',
			`press any key to ${chalk.greenBright('start')}`,
		],
		bootstrap: [
			{
				cmd: ['npm', 'i', '@jsnix/cli'],
				options: {
					cwd: 'bin',
				},
			},
			{
				cmd: ['ln', '-s', 'node_modules/@jsnix/cli/dist/cli/index.js', 'jsnix'],
				options: {
					cwd: 'bin',
				},
			},
		],
		entrypoint: ['jsnix'],
		jsnixExports,
		terminalOptions: {
			logLevel: 'info'
		}
	};

	const loadSnapshot = async () => {
		const module = await import('virtual:@jsnix/snapshot');
		return {
			'jsnix': {
				directory: module.default,
			},
			'bin': {
				directory: {},
			},
			'HELLO.md': {
				file: {
					contents: `Howdy, stranger! Feel free to poke around.

## Useful commands

\`\`\`sh
jsnix --help
\`\`\`

\`\`\`sh
ls /bin /usr/bin /usr/local/bin
\`\`\`

\`\`\`sh
cat ~/.jshrc
\`\`\`

\`\`\`sh
cd ~/workspace/jsnix/
\`\`\`
`,
				},
			},
		}
	}

	const loadExports = async () => {
		const modules = import.meta.glob('../../cli/commands/**/_app/jsnix.{js,jsx,ts,tsx}');
		const exports = await loadJsnixExports(modules);
		setJsnixExports(exports.filter((module) => module !== null));
	};

	useEffect(() => {
		loadExports();
	}, []);

	if (jsnixExports === undefined) {
		return null;
	}

	return (
		<Jsnix
			fs={loadSnapshot}
			options={options}
		/>
	);
}

export default App;
