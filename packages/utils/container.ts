import { WebContainer, FileSystemAPI, BootOptions, FSWatchOptions, FSWatchCallback, IFSWatcher, BufferEncoding, DirEnt, FileSystemTree } from '@webcontainer/api';
import path from 'path-browserify';

export type JsnixMountOptions = {
	mountPoint?: string,
	autoSave?: boolean
}
export type FsOrFsFunction = Fs | (() => Promise<Fs>);
export type Fs = ArrayBuffer | Uint8Array | FileSystemTree;

export class JsnixWebContainer extends WebContainer {
	declare fs: JsnixFileSystemAPI;

	static override async boot(bootOptions: BootOptions): Promise<JsnixWebContainer> {
		const container = await super.boot(bootOptions) as JsnixWebContainer;

		// Change the prototype of the instance to JsnixWebContainer
		Object.setPrototypeOf(container, JsnixWebContainer.prototype);

		// Replace the `fs` instance with the extended one
		container.fs = new JsnixFileSystem(container.fs, { cwd: container.workdir });
		// container.opfs = new OriginPrivateFileSystem()
		// await container.opfs.init()

		return container;
	}

	async loadSnapshot(): Promise<Fs | null> {
		return null;
		// TODO:
		// const snapshot = await this.opfs.toFileSystemTree()
		// console.log(this, this.opfs, snapshot, this.fs)
		// return Object.keys(snapshot).length === 0 ? null : snapshot
	}

	// TODO:
	// async watchAndSave(path: string) {
	// 	const watcher = this.fs.watch(path, { recursive: true }, async (_, filename) => {
	// 		try {
	// 			// readdir fails for non-files, so determining what filetype it should be can be done by catching that error
	// 			let contents: string | string[];
	// 			filename = filename as string

	// 			// TODO: handle directory and file renaming/removing
	// 			try {
	// 				contents = await this.fs.readdir(filename)
	// 				await this.opfs.mkdir(filename)
	// 			} catch (err) {
	// 				if ((err as Error).toString().indexOf('ENOTDIR') > -1) {
	// 					// not a directory, so it's a file
	// 					contents = await this.fs.readFile(filename, 'utf8')

	// 					// const test = await watcher._apiClient._fs['stats'](filename)
	// 					// console.log('lstat test', this._instance, this.fs, this.fs?._instance)

	// 					// this allows us to be aware of symlinks
	// 					// const tree = await this.export(filename, { format: 'json' })
	// 					// console.debug('have tree', { tree })
	// 					await this.opfs.write(filename, contents)
	// 				}
	// 			}
	// 		} catch (err) {
	// 			console.error('error reading/writing changed file', err);
	// 			watcher.close()
	// 		}
	// 	});
	// }

	override async mount(snapshot: Fs, { autoSave = true, ...options }: JsnixMountOptions) {
		// let mountPoint = options.mountPoint || '/';
		// let snapshot: Fs | null = autoSave ? await this.loadSnapshot() : null;
		// let wasNull = snapshot === null;

		// if (!snapshot) {
		// 	snapshot = ((typeof snapshotOrTree === 'function') ? await snapshotOrTree() : snapshotOrTree) as Fs;
		// }

		// TODO:
		// if (autoSave) {
		// 	wasNull && await this.opfs.writeTree(snapshot as FileSystemTree)
		// 	this.watchAndSave(mountPoint);
		// }
		return super.mount(snapshot, options);
	}
}


export type JsnixFileSystemOptions = {
	cwd: string;
}

/**
 * Extends the FileSystemAPI to allow specifying `cwd` in each method.
 */
class JsnixFileSystem implements JsnixFileSystemAPI {
	#baseFs: FileSystemAPI;
	#cwd: string;

	constructor(baseFs: FileSystemAPI, { cwd }: JsnixFileSystemOptions) {
		this.#baseFs = baseFs;
		this.#cwd = cwd;
	}

	resolve(inputPath: string, cwd?: string): string {
		const resolved = cwd ? path.relative(this.#cwd, path.isAbsolute(inputPath) ? inputPath : path.join(cwd, inputPath)) : inputPath;
		return resolved;
	}

	async readdir(path: string, options?: any): Promise<any> {
		const resolvedPath = this.resolve(path, options?.cwd);
		if (options?.encoding === 'buffer' && options?.withFileTypes) {
			return this.#baseFs.readdir(resolvedPath, { encoding: 'buffer', withFileTypes: true });
		}
		if (options?.encoding === 'buffer') {
			return this.#baseFs.readdir(resolvedPath, { encoding: 'buffer' });
		}
		return this.#baseFs.readdir(resolvedPath, options);
	}

	async readFile(path: string, encoding?: null | BufferEncoding, options?: { cwd?: string }): Promise<any> {
		const resolvedPath = this.resolve(path, options?.cwd);
		if (encoding) {
			return this.#baseFs.readFile(resolvedPath, encoding);
		}
		return this.#baseFs.readFile(resolvedPath, encoding);
	}

	async writeFile(
		path: string,
		data: string | Uint8Array,
		options?: string | { encoding?: string | null; cwd?: string } | null,
	): Promise<void> {
		const resolvedPath = this.resolve(path, (options as any)?.cwd);
		if (typeof options === 'string' || options?.encoding) {
			return this.#baseFs.writeFile(resolvedPath, data, options);
		}
		return this.#baseFs.writeFile(resolvedPath, data, options);
	}

	async mkdir(path: string, options?: { recursive?: boolean; cwd?: string }): Promise<any> {
		const resolvedPath = this.resolve(path, options?.cwd);

		if (options?.recursive) {
			return this.#baseFs.mkdir(resolvedPath, { recursive: true });
		}
		else {
			return this.#baseFs.mkdir(resolvedPath, { recursive: false });
		}
	}

	async rm(path: string, options?: { force?: boolean; recursive?: boolean; cwd?: string }): Promise<void> {
		const resolvedPath = this.resolve(path, options?.cwd);
		return this.#baseFs.rm(resolvedPath, options);
	}

	async rename(oldPath: string, newPath: string, options?: { cwd?: string }): Promise<void> {
		const resolvedOldPath = this.resolve(oldPath, options?.cwd);
		const resolvedNewPath = this.resolve(newPath, options?.cwd);
		return this.#baseFs.rename(resolvedOldPath, resolvedNewPath);
	}

	watch(
		filename: string,
		optionsOrListener?: string | null | {
			encoding?: BufferEncoding | null;
			persistent?: boolean;
			recursive?: boolean;
			cwd?: string;
		} | FSWatchCallback,
		listener?: FSWatchCallback,
	): IFSWatcher {
		if (typeof optionsOrListener === 'function') {
			const resolvedPath = this.resolve(filename);
			return this.#baseFs.watch(resolvedPath, undefined, optionsOrListener);
		}
		else {
			if (typeof optionsOrListener === 'string' || optionsOrListener === null) {
				const resolvedPath = this.resolve(filename);
				return this.#baseFs.watch(resolvedPath, optionsOrListener, listener);
			}
			const resolvedPath = this.resolve(filename, optionsOrListener?.cwd);
			return this.#baseFs.watch(resolvedPath, optionsOrListener, listener);
		}
	}

	_teardown(): void {
		// @ts-expect-error
		this.#baseFs._teardown();
	}
}

/**
 * Extends the original FileSystemAPI with optional `cwd` support for relevant methods.
 */
interface JsnixFileSystemAPI extends FileSystemAPI {
	resolve(inputPath: string, cwd?: string): string;

	readdir(path: string, options: 'buffer' | {
		encoding: 'buffer';
		withFileTypes?: false;
		cwd?: string;
	}): Promise<Uint8Array[]>;
	readdir(path: string, options?: {
		encoding?: BufferEncoding | null;
		withFileTypes?: false;
		cwd?: string;
	} | BufferEncoding | null): Promise<string[]>;
	readdir(path: string, options: {
		encoding: 'buffer';
		withFileTypes: true;
		cwd?: string;
	}): Promise<DirEnt<Uint8Array>[]>;
	readdir(path: string, options: {
		encoding?: BufferEncoding | null;
		withFileTypes: true;
		cwd?: string;
	}): Promise<DirEnt<string>[]>;

	readFile(path: string, encoding?: null, options?: { cwd?: string }): Promise<Uint8Array>;
	readFile(path: string, encoding: BufferEncoding, options?: { cwd?: string }): Promise<string>;

	writeFile(
		path: string,
		data: string | Uint8Array,
		options?: string | { encoding?: string | null; cwd?: string } | null
	): Promise<void>;

	mkdir(path: string, options?: {
		recursive?: false;
		cwd?: string;
	}): Promise<void>;
	mkdir(path: string, options: {
		recursive: true;
		cwd?: string;
	}): Promise<string>;

	rm(path: string, options?: {
		force?: boolean;
		recursive?: boolean;
		cwd?: string;
	}): Promise<void>;

	rename(oldPath: string, newPath: string, options?: { cwd?: string }): Promise<void>;

	watch(filename: string, options?: FSWatchOptions & { cwd?: string }, listener?: FSWatchCallback): IFSWatcher;
	watch(filename: string, listener?: FSWatchCallback): IFSWatcher;
}
