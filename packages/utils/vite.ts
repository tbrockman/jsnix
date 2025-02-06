/**
 * A Vite plugin that generates a WebContainer-compatible filesystem snapshot of a local directory.
 * Creates a virtual module that exports the JSON representation of the filesystem tree.
 *
 * @module @jsnix/snapshot
 */

import { snapshotDefaults, SnapshotProps, takeSnapshot } from '@jsnix/utils/snapshot';

export type Vite = unknown;
export const viteDefaults: Required<SnapshotProps<Vite>> = {
	...snapshotDefaults,
};

const createVirtualModule = async (_: string, tree: any): Promise<string> => {
	const snapshot = JSON.stringify(tree, null, 2);
	return `export default ${snapshot}`;
};

/**
 * @param {SnapshotProps<Vite>} props - Snapshot configuration options.
 *
 * @returns A Vite plugin that creates the snapshot virtual module.
 *
 * @example
 * // vite.config.ts
 * import { snapshot } from '@jsnix/snapshot'
 *
 * export default {
 *   plugins: [
 *     snapshot()
 *   ]
 * }
 */
export const snapshot = async (props: SnapshotProps<Vite> = {}) => {
	const { root, include, exclude, gitignore, transform } = { ...viteDefaults, ...props };
	const virtualModuleId = 'virtual:@jsnix/snapshot';
	const resolvedVirtualModuleId = '\0' + virtualModuleId;

	return {
		name: '@jsnix/snapshot',
		async resolveId(id: string) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
			return undefined;
		},
		async load(id: string) {
			if (id === resolvedVirtualModuleId) {
				const tree = await transform(await takeSnapshot({ root, include, exclude, gitignore }));
				return createVirtualModule(id, tree);
			}
			return undefined;
		},
	};
};
