import type { DirectoryNode, FileNode, FileSystemTree, SymlinkNode } from '@webcontainer/api';

export type TraversalResult = {
    name: string;
    node: DirectoryNode | FileNode | SymlinkNode;
    parent: FileSystemTree;
    path: string;
};

export const traverse = function* (tree: FileSystemTree, path = ''): Generator<TraversalResult> {
    for (const [name, node] of Object.entries(tree)) {
        const nodePath = path + ((path ? '/' : '') + name);
        yield { name, node, parent: tree, path: nodePath };

        if ('directory' in node) {
            yield* traverse(node.directory, nodePath);
        }
    }
};