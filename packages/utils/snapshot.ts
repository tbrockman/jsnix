import * as fs from 'node:fs/promises';
import path from 'node:path';
import parse from 'parse-gitignore';
import type { FileSystemTree } from '@webcontainer/api';
import ignore, { Ignore } from 'ignore';
import { constants, PathLike } from 'node:fs';

export const pathExists = async (filePath: PathLike) => {
	try {
		await fs.access(filePath, constants.F_OK);
		return true; // The path exists
	}
	catch {
		return false; // The path does not exist
	}
};

export const buildTree = async function* (dir: string, tree?: FileSystemTree, exclude?: Ignore, rootDir = dir): AsyncGenerator<string> {
	for await (const d of await fs.opendir(dir)) {
		const entry = path.join(dir, d.name);
		const relativeEntry = path.relative(rootDir, entry);

		if (exclude && exclude.ignores(relativeEntry)) {
			continue;
		}

		if (d.isDirectory()) {
			const node: FileSystemTree = {};

			if (tree) {
				tree[d.name] = { directory: node };
			}
			yield* buildTree(entry, node, exclude, rootDir);
		}
		else if (d.isFile()) {
			const contents = await fs.readFile(entry, 'utf8');
			if (tree) {
				tree[d.name] = { file: { contents } };
			}
			yield entry;
		}
		else if (d.isSymbolicLink()) {
			const symlink = await fs.readlink(entry);
			if (tree) {
				tree[d.name] = { file: { symlink } };
			}
			yield entry;
		}
	}
};

export const buildIgnore = async (root: string, include: string[], exclude: string[], gitignore: string | null) => {
	const excluded = ignore().add(exclude);

	if (gitignore !== null) {
		const resolved = path.resolve(root, gitignore);

		if (await pathExists(resolved)) {
			const ignoreFiles = await fs.readFile(resolved);
			// @ts-ignore
			const { patterns } = parse(ignoreFiles);
			excluded.add(patterns);
		}
	}
	// include patterns are negated and should supercede exclude
	include = include.map((pattern) => pattern.startsWith('!') ? pattern.slice(1) : `!${pattern}`);
	excluded.add(include);

	return excluded;
};

export const snapshotDefaults: Required<SnapshotProps<unknown>> = {
	root: process.cwd(),
	include: [],
	exclude: ['.git'],
	gitignore: '.gitignore',
	transform: async (fs: FileSystemTree) => fs,
};
export type SnapshotProps<T> = {
	transform?: (tree: FileSystemTree) => Promise<FileSystemTree>;
} & Partial<TakeSnapshotProps> & T;
export type TakeSnapshotProps = {
	root: string;
	include: string[];
	exclude: string[];
	gitignore: string | null;
};
/**
 * Takes a snapshot of the file system based on the provided properties.
 *
 * @param props - The properties to configure the snapshot.
 */
export const takeSnapshot = async (props: Partial<TakeSnapshotProps> = {}) => {
	const { root, include, exclude, gitignore } = { ...snapshotDefaults, ...props };
	const filetree: FileSystemTree = {};

	const excluded = await buildIgnore(root, include, exclude, gitignore);

	// eslint-disable-next-line
	for await (const _ of buildTree(root, filetree, excluded)) { }

	return filetree;
};
