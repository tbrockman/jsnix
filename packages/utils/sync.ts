import type { WebContainer } from '@webcontainer/api';
import { promiseWithTimeout } from '@jsnix/utils/promises';

/**
 * A utility function for writing content to a file in a manner which blocks until the content has been read by the guest container.
 * @param content
 * @param path
 * @param timeout
 * @returns
 */
export const writeUntilRead = async (container: WebContainer, path: string, content: string, timeout = 5000) => {
	return promiseWithTimeout<void>(async (resolve, reject) => {
		try {
			// container.fs only seems to be aware of our mounted filesystem
			// so instead we write from within the container
			const process = await container?.spawn('node', ['-e', `
                const fs = require('fs');
                const path = '${path}';
            
                // Write data to the file
                fs.writeFileSync(path, \`${content}\`);
                
                // Watch for changes to the file
                fs.watch(path, (eventType) => {
                    process.exit(0); // Exit when file changes
                });
              `]);
			await process?.exit;
		}
		catch (err) {
			reject(err);
		}
		finally {
			resolve();
		}
	}, timeout);
};
