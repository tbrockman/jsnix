// @ts-nocheck
import { JsnixTerminal } from '@jsnix/utils/terminal';
import { waitUntil } from '@jsnix/utils/promises';
import { FitAddon } from '@jsnix/addon-fit';
import '@jsnix/xterm/css/xterm.css';
import { OriginPrivateFileSystem } from '@jsnix/utils/opfs'; // Adjust the import path as needed

const term = new JsnixTerminal({
	allowProposedApi: true,
	reflowCursorLine: true,
});

window.opfs = () => new OriginPrivateFileSystem();
window.terminal = term;
window.waitUntil = waitUntil;
window.fit = new FitAddon();
term.open(document.getElementById('root')!);
term.loadAddon(window.fit);
window.fit.fit();
