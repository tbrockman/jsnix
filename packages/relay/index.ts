import { deserializeRequest, readJSONChunks, serializeResponse } from '@jsnix/utils/ipc';
import type {
	ReadableStream,
	WritableStream,
} from 'node:stream/web';

export class Relay {
	input: ReadableStream;
	output: WritableStream;

	constructor(input: ReadableStream, output: WritableStream) {
		this.input = input;
		this.output = output;
	}

	async start() {
		const writer = this.output.getWriter();
		await writer.ready;
		await writer.write(JSON.stringify({ type: 'ready' }) + '\r\n');

		for await (const json of readJSONChunks(this.input.getReader())) {
			const request = await deserializeRequest(json);
			const response = await fetch(request);
			const serializedResponse = await serializeResponse(response);
			await writer.write(serializedResponse + '\r\n');
		}
	}
}
