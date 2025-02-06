import fs from 'node:fs/promises';
import path from 'node:path';
import { buildIgnore, takeSnapshot, buildTree, SnapshotProps, snapshotDefaults } from '@jsnix/utils/snapshot';
import { FileSystemTree } from '@webcontainer/api';

export type Esbuild = {
	cacheDir?: string;
};

export type SnapshotCache = {
	timestamp: number;
	files: string[];
	totalSize: number;
	snapshot: FileSystemTree;
};

const cacheFolder = '.cache';
const cacheFile = '@jsnix-snapshot.json';
const esbuildDefaults: Required<SnapshotProps<Esbuild>> = {
	...snapshotDefaults,
	cacheDir: path.resolve(process.cwd(), cacheFolder),
};
export const snapshot = (props: SnapshotProps<Esbuild> = {}) => {
	const { root, cacheDir, include, exclude, gitignore, transform } = { ...esbuildDefaults, ...props };

	return {
		name: '@jsnix/snapshot',
		async setup(build: any) {
			const cacheFilePath = path.resolve(cacheDir, cacheFile);
			const excluded = await buildIgnore(root, include, exclude, gitignore);
			const resolved = path.resolve(root);

			// Check if the snapshot needs to be rebuilt
			async function needsRebuild(resolved: string, cache: SnapshotCache): Promise<boolean> {
				const seenFiles = new Set<string>(cache.files);
				let seenSize = 0;

				for await (const filePath of buildTree(resolved, undefined, excluded)) {
					const stats = await fs.stat(filePath);

					// Check for newer modifications
					if (stats.mtimeMs > cache.timestamp) return true;

					// Check whether we've seen this file
					if (!seenFiles.has(filePath)) return true;

					// Update seen files and size
					seenFiles.delete(filePath);
					seenSize += stats.size;
				}

				// Check for added or missing files and size mismatch
				if (seenFiles.size > 0 || seenSize !== cache.totalSize) {
					return true;
				}

				return false;
			}

			// Load or create the cache
			async function loadOrCreateCache(): Promise<SnapshotCache> {
				try {
					const cacheContent = await fs.readFile(cacheFilePath, 'utf-8');
					const cache = JSON.parse(cacheContent);
					return {
						...cache,
						files: new Set(cache.files),
					};
				}
				catch {
					return { timestamp: 0, files: [], totalSize: 0, snapshot: {} };
				}
			}

			// Save the cache
			async function saveCache(cache: SnapshotCache) {
				await fs.mkdir(path.dirname(cacheFilePath), { recursive: true });
				const serializedCache = {
					...cache,
					files: Array.from(cache.files), // Convert Set to array for JSON serialization
				};
				await fs.writeFile(cacheFilePath, JSON.stringify(serializedCache, null, 2));
			}

			build.onResolve({ filter: /^virtual:@jsnix\/snapshot/ }, (args: any) => {
				return {
					path: args.path,
					namespace: 'jsnix-snapshot',
				};
			});

			build.onLoad({ filter: /.*/, namespace: 'jsnix-snapshot' }, async () => {
				const cache = await loadOrCreateCache();
				const shouldRebuild = await needsRebuild(resolved, cache);

				let snapshot: FileSystemTree;
				if (shouldRebuild) {
					snapshot = await transform(await takeSnapshot({ root: resolved, include, exclude, gitignore }));

					const files: string[] = [];
					let totalSize = 0;

					for await (const filePath of buildTree(resolved, undefined, excluded)) {
						const stats = await fs.stat(filePath);

						files.push(filePath);
						totalSize += stats.size;

						// Update latest timestamp
						if (stats.mtimeMs > cache.timestamp) {
							cache.timestamp = stats.mtimeMs;
						}
					}

					cache.files = files;
					cache.totalSize = totalSize;
					cache.snapshot = snapshot;
					await saveCache(cache);
				}
				else {
					snapshot = cache.snapshot;
				}

				return {
					contents: `export default ${JSON.stringify(snapshot)}`,
					loader: 'js',
				};
			});
		},
	};
};
