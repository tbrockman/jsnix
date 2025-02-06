import { test, expect } from '@playwright/test';

test.describe('opfs', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to a blank page to ensure a clean environment
        await page.goto('http://localhost:3000/');

        // Clear OPFS storage before each test
        await page.evaluate(async () => {
            const rootHandle = await navigator.storage.getDirectory();
            for await (const [name, handle] of rootHandle.entries()) {
                await rootHandle.removeEntry(name, { recursive: true });
            }
        });
    });

    test.describe('toFileSystemTree', () => {
        test('should correctly generate a FileSystemTree', async ({ page }) => {
            // Create a test directory structure in the Origin Private File System
            await page.evaluate(async () => {
                const rootHandle = await navigator.storage.getDirectory();
                const testDirHandle = await rootHandle.getDirectoryHandle('testDir', { create: true });
                const fileHandle = await testDirHandle.getFileHandle('testFile.txt', { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write('Hello, World!');
                await writable.close();
            });

            // Call the method under test in the browser context
            const fileSystemTree = await page.evaluate(async () => {
                const a = window.opfs();
                await a.init();
                return await a.toFileSystemTree();
            });

            // Define the expected tree structure
            const expectedTree = {
                testDir: {
                    directory: {
                        'testFile.txt': {
                            file: {
                                contents: 'Hello, World!',
                            },
                        },
                    },
                },
            };

            // Assert that the generated tree matches the expected tree
            expect(fileSystemTree).toEqual(expectedTree);
        });

        test('should handle nested directories and empty files', async ({ page }) => {
            // Create a nested directory structure in the OPFS
            await page.evaluate(async () => {
                const rootHandle = await navigator.storage.getDirectory();
                const nestedDirHandle = await rootHandle.getDirectoryHandle('nestedDir', { create: true });
                const subDirHandle = await nestedDirHandle.getDirectoryHandle('subDir', { create: true });
                const fileHandle = await subDirHandle.getFileHandle('nestedFile.txt', { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write('Nested File Content');

                const otherFileHandle = await subDirHandle.getFileHandle('nestedFileTwo.txt', { create: true });
                await writable.close();
            });

            // Call the method under test in the browser context
            const fileSystemTree = await page.evaluate(async () => {
                const a = window.opfs();
                await a.init();
                return await a.toFileSystemTree();
            });

            // Define the expected tree structure
            const expectedTree = {
                nestedDir: {
                    directory: {
                        subDir: {
                            directory: {
                                'nestedFile.txt': {
                                    file: {
                                        contents: 'Nested File Content',
                                    },
                                },
                                'nestedFileTwo.txt': {
                                    file: {
                                        contents: '',
                                    },
                                },
                            },
                        },
                    },
                },
            };

            // Assert that the generated tree matches the expected tree
            expect(fileSystemTree).toEqual(expectedTree);
        });
    })

    test.describe('write', () => {
        test('should write content to a file', async ({ page }) => {
            // Create a new file in the root directory
            const tree = await page.evaluate(async () => {
                const a = window.opfs();
                await a.init();
                await a.write('test.txt', 'Hello, World!');
                return await a.toFileSystemTree();
            });

            expect(tree).toEqual({
                'test.txt': {
                    file: {
                        contents: 'Hello, World!',
                    },
                },
            });
        })

        test('should write content to a file (creating necessary intermediate folders)', async ({ page }) => {
            const tree = await page.evaluate(async () => {
                const a = window.opfs();
                await a.init();
                await a.write('/nested/dir/test.txt', 'Hello, World!');
                return await a.toFileSystemTree();
            });

            expect(tree).toEqual({
                nested: {
                    directory: {
                        dir: {
                            directory: {
                                'test.txt': {
                                    file: {
                                        contents: 'Hello, World!',
                                    }
                                }
                            }
                        }
                    }
                }
            })
        })
    });
})