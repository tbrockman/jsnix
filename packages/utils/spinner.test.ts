import { describe, it } from 'node:test';
import { clock, dots, earth, Spinner } from '@jsnix/utils/spinner';
import chalk from 'chalk';

function nodeStreamToWritableStream(nodeStream: NodeJS.WritableStream): WritableStream {
	return new WritableStream({
		write(chunk) {
			// Convert the chunk to a string (if it's a Buffer, etc.)
			const data = chunk instanceof Uint8Array ? new TextDecoder().decode(chunk) : chunk;

			// Write the data to the Node.js stream (e.g., process.stdout)
			nodeStream.write(data);
		},
		close() {
			// Close the Node.js stream when the WritableStream is closed
			nodeStream.end();
		},
		abort(err) {
			console.error(err);
		},
	});
}

describe('spinner', async () => {
	// TODO: actual test here
	it('should work', async () => {
		const root = new Spinner({
			text: 'root',
			stream: nodeStreamToWritableStream(process.stdout),
			...clock,
		});
		root.start();
		const child = root.addChild({
			text: 'child',
			...earth,
		});

		const grandchild = child.addChild({
			text: 'grandchild',
			...dots,
		});

		const ggrandchild = grandchild.addChild({
			text: 'grand-grandchild',
			...dots,
		});
		child.start();

		const child2 = root.addChild({
			text: 'other child',
			...dots,
		});
		child2.start();

		const anotherRoot = new Spinner({
			text: 'another',
			stream: nodeStreamToWritableStream(process.stdout),
			...clock,
		});
		anotherRoot.start();

		await new Promise((resolve) => setTimeout(resolve, 4000));
		await ggrandchild.stop(chalk.green('✔ great-grandchild done'));
		await new Promise((resolve) => setTimeout(resolve, 2000));
		await root.stop(chalk.green('✔ root done'));
		await new Promise((resolve) => setTimeout(resolve, 2000));
		await anotherRoot.stop(chalk.green('✔ another done'));
	});
});
