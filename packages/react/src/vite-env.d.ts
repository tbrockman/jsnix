/// <reference types="vite/client" />
/// <reference types="@webcontainer/api" />

declare module 'virtual:@jsnix/snapshot' {
	const snapshot: FileSystemTree; // Export the type
	export default snapshot;
}
