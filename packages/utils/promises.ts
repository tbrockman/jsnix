/**
 * Type definition for the executor function used in Promises.
 *
 * @template T - The type of the value that the promise will resolve to.
 * @param resolve - Function to resolve the promise with a value or a Promise-like value.
 * @param reject - Function to reject the promise with an error or reason.
 */
export type Executor<T> = (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void;

/**
 * Implementation of the `Promise.timeout` static method.
 * This method races the provided Promise against a timeout and rejects if the timeout period elapses first.
 *
 * @template T - The type of the value that the Promise resolves to.
 * @param executor - A function that is executed with `resolve` and `reject` functions to complete the Promise.
 * @param milliseconds - The maximum amount of time (in milliseconds) to wait before rejecting the Promise.
 *                       Defaults to 60,000 milliseconds (1 minute).
 * @returns A `Promise` that resolves or rejects based on the provided `executor` or times out after the specified duration.
 */
export const promiseWithTimeout = async <T>(executor: Executor<T>, milliseconds = 60000): Promise<T> => {
	const timeoutPromise = new Promise((_, reject) =>
		setTimeout(() => reject(`timed out after ${milliseconds} milliseconds`), milliseconds),
	);

	return Promise.race([new Promise(executor), timeoutPromise])
		.then((result) => result as T)
		.catch((e) => {
			throw Error(e);
		});
};

export const waitUntil = async (condition: () => boolean, timeout: number) => {
	return promiseWithTimeout<void>((resolve) => {
		const interval = setInterval(() => {
			const result = condition();
			if (result) {
				clearInterval(interval);
				resolve();
			};
		}, 10);
	}, timeout);
};
