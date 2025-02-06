import React, { useEffect, useState } from 'react';
import { Box, useApp } from 'ink';
import zod from 'zod';
import { argument } from '@jsnix/pastel';
import type Pastel from '@jsnix/pastel';
import Spinner from '@jsnix/cli/components/Spinner';
import { dots } from '@jsnix/utils/spinner';
import { port } from './_app/jsnix.js';
import http from 'http';
import { promiseWithTimeout } from '@jsnix/utils/promises';

export const example = ['code', 'jsnix/README.md'];
export const description = `📂 edit files

* ctrl+s to save
* ctrl+q to quit
* can only open children of ~/workspace
`;
export const args = zod.tuple([
	zod.string().describe(argument({
		name: 'file',
		description: 'file to open',
	})),
]);

export type CodeProps = {
	app: Pastel;
	args: zod.infer<typeof args>;
};

type StartServerProps = {
	args: CodeProps['args'];
};

const startServer = async ({ args }: StartServerProps): Promise<void> => {
	let server: http.Server | null = null;

	try {
		server = await promiseWithTimeout<http.Server>(async (resolve, reject) => {

			try {
				const inner = http.createServer((req, res) => {
					if (req.url === '/' && req.method === 'GET') {
						res.statusCode = 200;
						res.setHeader('Content-Type', 'application/json');
						res.end(JSON.stringify({
							path: args[0],
							cwd: process.cwd(),
						}));
					} else if (req.url === '/exit' && req.method === 'POST') {
						res.statusCode = 200;
						res.setHeader('Content-Type', 'text/plain');
						res.end('OK');
						resolve(inner);
					}
					else {
						res.statusCode = 404;
						res.setHeader('Content-Type', 'text/plain');
						res.end('Not Found');
					}
				});
				inner.listen(port, 'localhost');
			}
			catch (e) {
				reject(e);
			}
			return null;
		}, 5 * 60 * 1000); // wait at most 5m for the server to start

	} catch (e) {
		console.error(e);
	} finally {
		server?.close();
	}
};

export default function Code({ args, app }: CodeProps) {
	const [isOpen, setIsOpen] = useState(false);
	const { exit } = useApp();

	useEffect(() => {
		if (!isOpen) {
			startServer({ args }).then(() => {
				setIsOpen(true);
			}).catch((err: any) => {
				app.render?.clear();
				exit(err);
			});
		}
	}, [isOpen]);

	useEffect(() => {
		if (isOpen) {
			app.render?.clear();
			exit();
		}
	}, [isOpen]);

	if (isOpen) {
		return null;
	}

	return (
		<Box>
			<Spinner {...dots} />
		</Box>
	);
}
