import { Soundcloud } from './scrape.js';

export const run = async (clientId = 'AsIBxSC4kw4QXdGp0vufY0YztIlkRMUc', oauthToken = '', output = './scrape.json') => {
	const fs = await import('node:fs/promises');

	const soundcloud = new Soundcloud(clientId, oauthToken);

	// TODO: filter private songs
	try {
		const data = await soundcloud.list('56992816', {
			tracks: true,
			reposts: true,
			playlists: false,
			likes: true,
		});
		const json = JSON.stringify(data, null, 2);
		await fs.writeFile(output, json, { encoding: 'utf-8' });
	}
	catch (error) {
		console.error(error);
	}
};
