import { DirectoryNode, FileNode, FileSystemTree } from "@webcontainer/api";
import { LRUCache } from "lru-cache";
import { traverse } from "./filesystemtree";

export type FileOrFolder = FileSystemDirectoryHandle | FileSystemFileHandle;
export type OPFSItem<T extends FileOrFolder = FileOrFolder> = {
    path: string;
    handle: T;
};

export class OriginPrivateFileSystem {
    /**
     * Root directory handle.
     */
    #root: OPFSItem<FileSystemDirectoryHandle> | null = null;

    /**
     * Map of handles to absolute directories, to avoid re-fetching them.
     */
    #directoryHandles: LRUCache<string, OPFSItem<FileSystemDirectoryHandle>> = new LRUCache({ max: 1024 * 512 });

    async init() {
        this.#root = {
            path: '/',
            handle: await navigator.storage.getDirectory(),
        };
    }

    get root(): OPFSItem<FileSystemDirectoryHandle> {
        if (!this.#root) throw new Error('OriginPrivateFileSystem not initialized');
        return this.#root;
    }

    // Helper function to recursively build the tree
    async #buildTree(handle: FileSystemDirectoryHandle, currentTree: FileSystemTree) {
        for await (const [name, entry] of handle.entries()) {
            if (entry.kind === 'directory') {
                const directoryNode: DirectoryNode = { directory: {} };
                currentTree[name] = directoryNode;
                await this.#buildTree(entry as FileSystemDirectoryHandle, directoryNode.directory);
            } else if (entry.kind === 'file') {
                const file = await (entry as FileSystemFileHandle).getFile();
                const contents = await file.text();
                const fileNode: FileNode = { file: { contents } };
                currentTree[name] = fileNode;
            }
        }
    }

    async writeTree(tree: FileSystemTree) {
        for await (const { node, path } of traverse(tree)) {
            if ('file' in node && 'contents' in node.file) {
                const content = node.file.contents as string;
                await this.write(path, content)
            } else if ('directory' in node) {
                await this.mkdir(path);
            }
        }
    }

    async toFileSystemTree(): Promise<FileSystemTree> {
        const tree: FileSystemTree = {};

        await this.#buildTree(this.root.handle, tree);
        return tree;
    }

    async *traverse(filter: (name: string, path: string, entry: FileOrFolder) => boolean = () => true): AsyncGenerator<OPFSItem> {
        let stack: OPFSItem[] = [this.root];

        while (stack.length > 0) {
            const { path, handle } = stack.pop()!;

            // @ts-ignore
            for await (const [entryName, entryHandle] of handle.entries()) {
                const entryPath = path + '/' + entryName;
                const node = { name: entryName, path: entryPath, handle: entryHandle };

                if (filter && !filter(entryName, entryPath, entryHandle)) continue;

                if (entryHandle.kind === 'directory') {
                    stack.push(node);
                    this.#directoryHandles.set(entryPath, node);
                }
                yield node;
            }
        }
    }

    /**
     * Remove a file or directory from the file system.
     * @param path Path to file to remove
     */
    async rm(path: string): Promise<void> {
        const segments = path.split('/').filter(Boolean); // Remove empty segments
        if (segments.length === 0) throw new Error('Cannot remove the root directory');

        // Traverse to the parent directory of the target
        const parentPath = segments.slice(0, -1).join('/') || '/';
        const parentDir = await this.#getDirectory(parentPath);

        if (!parentDir) throw new Error(`Parent directory not found: ${parentPath}`);

        const targetName = segments[segments.length - 1]!;

        // Check if the target is a directory or file
        try {
            await parentDir.handle.removeEntry(targetName, { recursive: true });
            // Remove the target from the cache if it exists
            this.#directoryHandles.delete(path);
        } catch (error) {
            throw new Error(`Failed to remove file or directory at path: ${path}`);
        }
    }

    async write(path: string, content: string): Promise<void> {
        // Get or create the file handle
        const fileItem = await this.#getPathFileHandle(path);
        if (!fileItem) throw new Error(`Failed to open or create file at path: ${path}`);

        // Write the content to the file
        const writable = await fileItem.handle.createWritable();
        await writable.write(content);
        await writable.close();
    }

    async mkdir(path: string): Promise<void> {
        await this.#getDirectory(path);
    }

    /**
     * Helper function to get a directory handle by path.
     * @param path Path to the directory
     */
    async #getDirectory(path: string): Promise<OPFSItem<FileSystemDirectoryHandle>> {
        if (path === '/') return this.root;

        const segments = path.split('/').filter(Boolean);
        let currentDir = this.root;

        for (const dirName of segments) {
            const dirPath = currentDir.path + (currentDir.path === '/' ? '' : '/') + dirName;

            if (this.#directoryHandles.has(dirPath)) {
                currentDir = this.#directoryHandles.get(dirPath)!;
            } else {
                const newDirHandle = await currentDir.handle.getDirectoryHandle(dirName, { create: true });
                const newDirItem: OPFSItem<FileSystemDirectoryHandle> = {
                    path: dirPath,
                    handle: newDirHandle,
                };
                this.#directoryHandles.set(dirPath, newDirItem);
                currentDir = newDirItem;
            }
        }
        return currentDir;
    }

    async #getPathFileHandle(path: string): Promise<OPFSItem<FileSystemFileHandle> | null> {
        const segments = path.split('/').filter(Boolean); // Remove empty segments
        const parentPath = segments.slice(0, -1).join('/') || '/';
        let parentDir = await this.#getDirectory(parentPath);

        // Get or create the file handle
        const fileName = segments[segments.length - 1]!;
        const filePath = parentPath + (parentPath === '/' ? '' : '/') + fileName;
        const fileHandle = await parentDir.handle.getFileHandle(fileName, { create: true });
        return {
            path: filePath,
            handle: fileHandle,
        };
    }
}