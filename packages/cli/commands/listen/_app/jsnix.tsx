import React from 'react';
import { createRoot } from 'react-dom/client';
import { OscData } from '@jsnix/utils/types';
import SoundcloudPlayer from './SoundcloudPlayer';

export const bin = ['listen', 'vibe'];
export const osc: OscData = {
	id: 80086,
	handler: async ({ terminal, data }) => {
		const marker = terminal.registerMarker();

		if (marker) {
			const { ids } = data as { ids: string[] };
			const node = document.createElement('div');
			createRoot(node).render(<SoundcloudPlayer ids={ids} />);
			await terminal.attachElementToMarker(node, marker);
		}
		return true;
	},
};
