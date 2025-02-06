import fs from 'fs/promises';
import { KeyValue } from '@jsnix/utils/types';
import { promiseWithTimeout } from '@jsnix/utils/promises';

export const waitForFileChange = async (path: string, timeout: number = 5000) => {
	return await promiseWithTimeout(async (resolve, reject) => {
		try {
			// eslint-disable-next-line
			for await (const _ of fs.watch(path)) {
				resolve(true);
				break;
			}
		}
		catch (e) {
			reject(e);
		}
	}, timeout);
};

export const writeOsc = async (
	id: number,
	data: KeyValue,
	encoding: BufferEncoding = 'base64',
	timeoutMs: number = 5000,
): Promise<string | null> => {
	const b64 = Buffer.from(JSON.stringify(data)).toString(encoding);
	const uid = crypto.randomUUID();
	const sequence = `\x1b]${id};data;${uid};${b64}\x07`;
	const path = `/tmp/${uid}`;

	// Create a file for synchronization
	await fs.writeFile(path, '');
	// Send the OSC command
	console.log(sequence);
	// Wait for the handler to process the file
	await waitForFileChange(path, timeoutMs);
	// Read contents of output from handler (if any)
	const contents = await fs.readFile(path, 'utf8');
	// Remove the file
	await fs.rm(path);
	// Return any file contents to the caller
	return contents.length > 0 ? contents : null;
};
