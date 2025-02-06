export type SpinnerIconArgs = { success: string; error: string; warning: string };
export type ChildSpinnerOptions = Omit<SpinnerOptions, 'stream'>;
export type SpinnerOptions = {
	text?: string;
	frames: string[];
	interval: number;
	index?: number;
	stream: WritableStream;
	level?: number;
	sibling?: Spinner;
};

// A stack to track each running spinner (to facilitate multiple spinners)
const roots: Spinner[] = [];

export class Spinner {
	text?: string;
	stream: WritableStream;
	frames: string[];
	interval: number;
	index: number;
	timer: any | null;
	lastFrame: string | null;
	level: number;
	children: Spinner[] = [];
	sibling?: Spinner;
	icons: SpinnerIconArgs = {
		success: '✔',
		error: '✖',
		warning: '⚠',
	};

	constructor({ text, frames, interval, index = 0, stream, level = 0, sibling }: SpinnerOptions) {
		this.text = text;
		this.frames = frames;
		this.interval = interval;
		this.index = index;
		this.timer = null;
		this.stream = stream;
		this.lastFrame = null;
		this.level = level;
		this.sibling = sibling;

		if (level === 0 && roots.length > 0) {
			// @ts-ignore
			roots[roots.length - 1].sibling = this;
		}
		roots.push(this);
	}

	addChild(options: ChildSpinnerOptions): Spinner {
		const spinner = new Spinner({
			stream: this.stream,
			level: this.level + 1,
			...options,
		});

		if (this.children.length > 0) {
			// @ts-ignore
			this.children[this.children.length - 1].sibling = spinner;
		}
		this.children.push(spinner);
		return spinner;
	}

	start() {
		this.timer = setInterval(async () => {
			await this.render();
		}, this.interval);
		this.children.forEach((child) => child.start());
	}

	clearFrame() {
		this.lastFrame = null;
		this.children.forEach((child) => child.clearFrame());
	}

	async clearTimer() {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
		this.children.forEach((child) => child.clearTimer());
	}

	async stop(text?: string) {
		if (!this.timer) return;
		this.clearTimer();

		const writer = this.stream.getWriter();

		try {
			await writer.ready;
			await this.clear(writer);
			this.clearFrame();
			await this.write(text || null, writer);
		}
		finally {
			writer.releaseLock();
		}
	}

	async render() {
		if (!this.timer) return;

		const writer = this.stream.getWriter();
		try {
			await writer.ready;
			await this.clear(writer);
			this.next();
			await this.write(this.frame(), writer);
		}
		finally {
			writer.releaseLock();
		}
	}

	next() {
		this.index = (this.index + 1) % this.frames.length;
	}

	async clearLine(writer: WritableStreamDefaultWriter) {
		await writer.write('\x1b[F\x1b[2K');
	}

	async clear(writer: WritableStreamDefaultWriter) {
		// clear siblings
		this.sibling && await this.sibling.clear(writer);

		// clear children (which will clear their children and siblings)
		// @ts-ignore
		this.children.length > 0 && await this.children[0].clear(writer);

		// clear self
		if (this.lastFrame) {
			await this.clearLine(writer);
		}
	}

	indent() {
		return ' '.repeat(this.level * 2);
	}

	frame() {
		return `${this.frames[this.index]} ${this.text || ''}`;
	}

	async write(text: string | null, writer: WritableStreamDefaultWriter) {
		// write self
		if (text) {
			await writer.write(this.indent() + text + '\n');
		}
		this.lastFrame = text;

		// write children (which will write their children and siblings)
		// @ts-ignore
		this.children.length > 0 && await this.children[0].write(this.children[0].lastFrame, writer);

		// write siblings
		this.sibling && await this.sibling.write(this.sibling.lastFrame, writer);
	}

	get isRunning() {
		return this.timer !== null;
	}
}

export const earth = {
	interval: 180,
	frames: [
		'🌍',
		'🌎',
		'🌏',
	],
};

export const dots = {
	interval: 80,
	frames: [
		'⠋',
		'⠙',
		'⠹',
		'⠸',
		'⠼',
		'⠴',
		'⠦',
		'⠧',
		'⠇',
		'⠏',
	],
};

export const clock = {
	interval: 100,
	frames: [
		'🕛',
		'🕐',
		'🕑',
		'🕒',
		'🕓',
		'🕔',
		'🕕',
		'🕖',
		'🕗',
		'🕘',
		'🕙',
		'🕚',
	],
};

export const squareCorners = {
	interval: 120,
	frames: [
		'◰ ',
		'◳ ',
		'◲ ',
		'◱ ',
	],
};

export const pipe = {
	interval: 100,
	frames: [
		'┤ ',
		'┘ ',
		'┴ ',
		'└ ',
		'├ ',
		'┌ ',
		'┬ ',
		'┐ ',
	],
};
