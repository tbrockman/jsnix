import type { JsnixTerminal } from '@jsnix/utils/terminal';
import type { WebContainer, WebContainerProcess } from '@webcontainer/api';
import type { Editor } from '@jsnix/utils/editor';
import type * as monaco from 'monaco-editor';

export type Primitive = string | number | boolean | null | undefined | object;
export type Values = Primitive | Primitive[] | KeyValue;
export type KeyValue = {
	[key in string]: Values;
};

export type OscHandlerProps = {
	data: KeyValue;
	terminal: JsnixTerminal;
	document: Document;
	container: WebContainer | null;
	editor: Editor | null;
	initEditor: () => Promise<{ editor: Editor; monaco: monaco.editor.IStandaloneCodeEditor }>;
	process: WebContainerProcess | null;
	// ...
};

export type OscHandlerResponse = boolean | string;
export type OscHandler = (props: OscHandlerProps) => Promise<OscHandlerResponse>;
export type OscData = {
	id: number;
	handler: OscHandler;
};
export type OnServerReadyHandler = (props: OnServerReadyProps) => Promise<void>;
export type OnServerReadyProps = {
	port: number;
	url: string;
	fetch: (req: RelayRequestInit) => Promise<Response | null>;
	container: WebContainer | null;
	editor: Editor | null;
	terminal: JsnixTerminal | null;
	initEditor: () => Promise<{ editor: Editor; monaco: monaco.editor.IStandaloneCodeEditor }>;
};
export type OnPortHandlerProps = OnServerReadyProps & {
	type: 'close' | 'open';
};
export type OnPortHandler = (props: OnPortHandlerProps) => Promise<void>;
export type JsnixExports = {
	bin?: string[];
	osc?: OscData;
	onServerReady?: OnServerReadyHandler;
	onPort?: OnPortHandler;
};
export type RelayRequestInit = Omit<RequestInit, 'body'> & {
	body?: string | null | undefined;
	path?: string;
};
export type RelayRequest = RelayRequestInit & {
	url: string;
};
