import { OnServerReadyHandler } from '@jsnix/utils/types';

export const port = 9191;
export const bin = ['code'];
export const onServerReady: OnServerReadyHandler = async ({ port: serverPort, fetch, editor, initEditor }) => {
	if (serverPort !== port) {
		return;
	}

	let response = await fetch({ method: 'GET' });
	const { path, cwd } = (await response?.json()) || {};

	if (!editor) {
		editor = (await initEditor()).editor!;
	}

	if (path) {
		await editor.open(path, cwd);
	}
	// Close our server after opening the editor (exitting the CLI)
	try {
		response = await fetch({ method: 'POST', path: '/exit' });
	} catch (e) {
		console.error('failed to forcefully close', e)
	}
};
