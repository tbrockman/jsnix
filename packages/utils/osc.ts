import { writeUntilRead } from '@jsnix/utils/sync';
import { JsnixExports, OscData, OscHandler, OscHandlerProps } from '@jsnix/utils/types';

export type WrapperProps = Omit<OscHandlerProps, 'data'> & {
	data: string;
};
export type WrappedOscHandler = (props: WrapperProps) => Promise<boolean>;
export type WrappedOscData = Omit<OscData, 'handler'> & {
	handler: WrappedOscHandler;
};
export type WrappedJsnixExports = Omit<JsnixExports, 'osc'> & {
	name?: string;
	osc?: WrappedOscData;
};

export const wrapOscHandler = (handler: OscHandler) => {
	return async ({ data, container, terminal, ...rest }: WrapperProps): Promise<boolean> => {
		const [type, uid, encoded] = data.split(';');

		if (type !== 'data' || !uid || !encoded) {
			return false;
		}
		const json = JSON.parse(new TextDecoder()
			.decode(Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))));
		const result = await handler({ data: json, container, terminal, ...rest });
		if (!container) {
			typeof result === 'string' && console.warn('WebContainer unavailable, will be unable to use OSC handler output.', result);
			return true;
		}
		const tempfile = `/tmp/${uid}`;
		const content = (typeof result === 'string') ? result : '';
		await writeUntilRead(container, tempfile, content);
		return (typeof result === 'string') ? true : result;
	};
};

export const loadJsnixExports = async (modules: Record<string, () => Promise<unknown>>) => {
	return await Promise.all(
		Object.values(modules).map(async (command) => {
			try {
				const split = command?.name?.split('/');
				let name: string | undefined = undefined;

				if (split) {
					if (split.length == 1) {
						name = split[0];
					}
					else if (split.length > 2) {
						name = split[split.length - 3];
					}
				}
				const { osc, bin, onServerReady, onPort }: any = await command();
				let result: WrappedJsnixExports = {
					bin,
					name,
					onServerReady,
					onPort,
				};
				if (osc) {
					if (!osc.handler) {
						throw new Error('Exported `osc` missing a handler');
					}
					if (!osc.id) {
						throw new Error('Exported `osc` missing an id');
					}
					result = {
						...result,
						osc: {
							id: osc.id,
							handler: wrapOscHandler(osc.handler),
						},
					};
				}
				return result;
			}
			catch (error) {
				console.error('Error loading command:', error);
				return null;
			}
		}),
	);
};
