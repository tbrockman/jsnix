import { RelayRequest } from './types.js';

export const END_OF_MESSAGE = '\0';
export const READY = `READY`;

export const serializeRequest = async (request: RelayRequest): Promise<string> => {
	return JSON.stringify({ ...request, type: 'request' });
};

export const deserializeRequest = async (data: string | Record<string, any>): Promise<Request> => {
	const parsed = typeof data === 'string' ? JSON.parse(data) : data;

	let { url } = parsed;
	const { path, method, headers, body } = parsed;

	if (path) {
		url = new URL(path, url);
	}

	return new Request(url, {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined,
	});
};

export const serializeResponse = async (response: Response): Promise<string> => {
	const body = await response.text();

	const headers: Record<string, string> = {};
	for (const [key, value] of response.headers.entries()) {
		headers[key] = value;
	}

	return JSON.stringify({
		type: 'response',
		url: response.url,
		status: response.status,
		statusText: response.statusText,
		headers,
		body,
	});
};

export const deserializeResponse = async (data: string | any): Promise<Response> => {
	try {
		const parsed = typeof data === 'string' ? JSON.parse(data) : data;
		const { status, statusText, headers, body } = parsed;
		return new Response(body, {
			status,
			statusText,
			headers,
		});
	}
	catch (error) {
		console.error('Error deserializing response:', error);
		return new Response(JSON.stringify({ error }), { status: 500 });
	}
};

export const readJSONChunks = async function* (reader: ReadableStreamDefaultReader<Uint8Array<ArrayBufferLike>>, debug?: boolean, id?: string): AsyncGenerator<Record<string, any>> {
	const decoder = new TextDecoder('utf8');

	let buffer = '';

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			debug && console.debug(JSON.stringify({ type: 'debug', value, id }));

			// Decode the chunk and append it to the buffer
			buffer += typeof value === 'string' ? value : (decoder.decode(value, { stream: true }) + '\r\n');

			debug && console.debug(JSON.stringify({ type: 'debug', buffer, id }));

			// Split the buffer into lines
			const parts = buffer.split('\r\n');

			// Keep the last part in the buffer (incomplete JSON string)
			buffer = parts.pop()!;

			debug && console.debug(JSON.stringify({ type: 'debug', parts_length: parts.length, id }));

			// Yield all complete JSON strings
			for (const part of parts) {
				debug && console.debug(JSON.stringify({ type: 'debug', part, id }));

				if (part.trim()) {
					yield JSON.parse(part);
				}
			}
		}
		// Handle any remaining data in the buffer
		if (buffer.trim()) {
			yield JSON.parse(buffer);
		}
	}
	catch (err) {
		debug && console.debug(JSON.stringify({ err }));
	}
};
