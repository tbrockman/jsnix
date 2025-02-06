import { useEffect } from 'react';
import { writeOsc } from '@jsnix/utils/helpers';
import { osc } from './_app/jsnix.js';
import { useApp } from 'ink';
import { argument } from '@jsnix/pastel';
import zod from 'zod';

export const description = `🌐 render html`;
export const args = zod.tuple([
	zod.string().describe(argument({
		name: 'html',
		description: 'html to render',
	})),
]);

const banner = `<div style="width: 100%;
	display: flex;
	box-sizing: border-box;
	justify-content: center;
	padding: 1rem;">
	<div style="background-color: #383838;
				box-shadow: -1rem 1rem #171717;
				padding: 1rem;
				padding-bottom: 2rem;
				white-space: pre-wrap;
				font-size: clamp(6px, calc(100vw / 34), 16px);
				font-family: monospace;
				color: white;
				border: 4px solid #0a0a0a;
				width: 100%;
				display: flex;
				box-sizing: border-box;
				justify-content: center;
				align-items: flex-start;
				line-height: initial;">
████████╗██╗  ██╗███████╗ ██████╗ 
╚══██╔══╝██║  ██║██╔════╝██╔═══██╗
   ██║   ███████║█████╗  ██║   ██║
   ██║   ██╔══██║██╔══╝  ██║   ██║
   ██║   ██║  ██║███████╗╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝


     dev 💻 artist 🎨 goof 🤡
</div></div>`;
export type DivProps = {
	args: zod.infer<typeof args>;
};
export const example = ['html', banner];
export default function Html({ args }: DivProps) {
	const { exit } = useApp();

	useEffect(() => {
		writeOsc(osc.id, { html: args[0] }).then(() => exit());
	}, []);

	return null;
}
