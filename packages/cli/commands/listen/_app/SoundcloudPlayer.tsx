import React from 'react';
import { json } from '@jsnix/scripts/scrape';
import type { SoundcloudItem } from '@jsnix/scripts/scrape';

export type SoundcloudEmbedProps = {
	item: SoundcloudItem;
	height?: string;
	width?: string;
	autoPlay?: boolean;
};

function SoundcloudEmbed({ item, width = '100%', height = '300px', autoPlay = true }: SoundcloudEmbedProps) {
	let path = '';

	if ('embeddable_by' in item) {
		path = `tracks/${item.id}`;
	}
	else {
		path = `playlists/${item.id}`;
	}

	return (
		// @ts-ignore
		<iframe credentialless="true" allow={autoPlay && 'autoplay'} width={width} height={height} src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/${path}&color=%23ff5500&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=false&visual=true`}></iframe>
	);
}

interface SoundcloudPlayerProps {
	ids: string[];
}

export default function SoundcloudPlayer({ ids }: SoundcloudPlayerProps) {
	const idSet = new Set(ids.map((id) => parseInt(id)));
	const collection: SoundcloudItem[] = Object.entries(json)
		.reduce(
			(acc, [, items]) => {
				items.forEach((item) => {
					if (idSet.has(item.id)) {
						acc.push(item);
					}
				});
				return acc;
			},
			[] as SoundcloudItem[]);

	return (
		<div style={{ height: 'fit-content' }}>
			{collection.map((item) => (
				<SoundcloudEmbed key={item.id} item={item} />
			))}
		</div>
	);
};
