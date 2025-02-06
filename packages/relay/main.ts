import { Readable } from 'node:stream';
import { Relay } from './index.js';

try {
	const input = Readable.toWeb(process.stdin);
	const output = new WritableStream({
		write(chunk) {
			process.stdout.write(chunk, 'utf8');
		},
	});
	const relay = new Relay(input, output);
	await relay.start();
	process.exit(0);
}
catch (err) {
	console.error(err);
	process.exit(1);
}
