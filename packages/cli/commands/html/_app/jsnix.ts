import { OscData } from '@jsnix/utils/types';

export const bin = ['html']
export const osc: OscData = {
	id: 80085,
	handler: async ({ data, terminal, document }) => {
		const marker = terminal.registerMarker();

		if (marker) {
			const { html } = data as { html: string };
			const node = document.createElement('template');
			node.innerHTML = html;
			const child = node.content.firstElementChild;

			if (child && child instanceof HTMLElement) {
				await terminal.attachElementToMarker(child, marker);
			}
		}
		return true;
	},
};
