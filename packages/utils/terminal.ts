import { IDecoration, IDecorationOptions, Terminal as XTerminal } from '@jsnix/xterm';

export interface JsnixDecoration extends IDecoration {
	hasRendered: Promise<void>;
}

export class JsnixTerminal extends XTerminal {
	process?: {
		input: WritableStreamDefaultWriter<string>;
	};
	debug: boolean = false;

	getActiveBuffer(ugly: boolean = false, clip: boolean = true): string {
		const buffer = this.buffer.active;
		let print = '';

		for (let i = 0; i < buffer.length; i++) {
			if (clip && i < buffer.viewportY) continue;

			const line = buffer.getLine(i);
			const string = line?.translateToString(false);

			if (ugly) {
				const padding = ' '.repeat((Math.log(buffer.length) * Math.LOG10E + 1 | 0) - (Math.log(i) * Math.LOG10E + 1 | 0 || 1));
				const hasCursor = (buffer.cursorY + buffer.viewportY) === i;
				const markers = this.markers.filter((marker) => marker.line === i);
				print += `[${padding}${i}] ` + string;
				print += line?.isWrapped ? '[wraps]' : '';
				print += hasCursor ? '<-- cursor' : '';

				markers.forEach((marker) => {
					print += `<-- marker [${marker.id}]`;
				});
				print += '\n';
			}
			else {
				print += string + '\n';
			}
		}
		return print;
	}

	printBuffer() {
		if (!this.debug) return;

		const printable = this.getActiveBuffer(this.debug);
		const buffer = this.buffer.active;

		console.debug({ bufferLength: buffer.length, cursorY: buffer.cursorY, cursorX: buffer.cursorX, viewportY: buffer.viewportY, baseY: buffer.baseY, rows: this.rows, cols: this.cols, markers: this.markers });
		console.debug(printable);
	}

	async writeAsync(data: string | Uint8Array): Promise<void> {
		return new Promise((resolve) => super.write(data, resolve));
	}

	override async write(data: string | Uint8Array, callback?: () => void) {
		return this.writeAsync(data).then(() => callback?.());
	}

	async writelnAsync(data: string | Uint8Array): Promise<void> {
		return new Promise((resolve) => super.writeln(data, resolve));
	}

	override async writeln(data: string | Uint8Array, callback?: () => void) {
		return this.writelnAsync(data).then(() => callback?.());
	}

	getWritableStream<T extends (string | Uint8Array)>(): WritableStream<T> {
		return new WritableStream<T>({
			write: async (chunk: T) => {
				this.write(chunk);
			},
		});
	}

	override registerDecoration(decorationOptions: IDecorationOptions): JsnixDecoration | undefined {
		const decoration = super.registerDecoration(decorationOptions);

		if (decoration) {
			return {
				...decoration,
				hasRendered: new Promise((resolve) => {
					const disposable = decoration?.onRender(() => {
						resolve();
						this.printBuffer();
						disposable.dispose();
					});
				}),
			} as JsnixDecoration;
		}
		return undefined;
	}
}
