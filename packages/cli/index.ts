#!/usr/bin/env node
const { default: Pastel } = await import('@jsnix/pastel');

// TODO: fix ctrl-c
const app = new Pastel({
	importMeta: import.meta,
	name: 'jsnix',
});
const { waitUntilExit } = await app.run();
await waitUntilExit();
process.exit(); // Seems to be necessary for terminating if opened with "container.spawn" 🤷‍♂️
