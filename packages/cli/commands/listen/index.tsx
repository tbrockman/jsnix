import React, { useEffect, useState } from 'react';
import { writeOsc } from '@jsnix/utils/helpers';
import { Box, Text, useApp } from 'ink';
import zod from 'zod';
import { useTracks } from './_app/useTracks.js';
import type { ListResponse, SoundcloudItem } from '@jsnix/scripts/soundcloud/scrape';
import { link } from '@jsnix/utils/escapes';
import { chooseRandom } from '@jsnix/utils/collection';
import chalk from 'chalk';

export const example = ['listen'];
export const description = '🎵 catch a vibe';
export const options = zod.object({
	tracks: zod.boolean().optional().default(true).describe('don\'t include my soundcloud tracks'),
	reposts: zod.boolean().optional().default(false).describe('include my soundcloud reposts'),
	likes: zod.boolean().optional().default(false).describe('include my soundcloud likes'),
	playlists: zod.boolean().optional().default(false).describe('include my soundcloud playlists'),
	list: zod.boolean().optional().default(false).describe('list rather than play'),
	urls: zod.boolean().optional().default(false).describe('include urls (for terminals which dont support links)'),
});
type ListenProps = {
	options: zod.infer<typeof options>;
};

export type SongProps = SoundcloudItem & {
	urls?: boolean;
};

const Song = ({ title, permalink_url, urls }: SongProps) => {
	return (
		<Text>
			Track:
			{' '}
			{link(title, permalink_url)}
			{urls && ` (${permalink_url})`}
		</Text>
	);
};

export type SongListProps = ListResponse & {
	urls?: boolean;
};

const SongList = ({ tracks, playlists, reposts, likes, urls }: SongListProps) => {
	const items = [
		...(tracks || []),
		...(playlists || []),
		...(reposts || []),
		...(likes || []),
	];

	return (
		<Box flexDirection="column">
			{items.map((item) => <Song key={item.id} urls={urls} {...item} />)}
		</Box>
	);
};

export default function Listen({ options: { reposts, likes, tracks, playlists, list, urls } }: ListenProps) {
	const { exit } = useApp();
	const results = useTracks({ reposts, likes, tracks, playlists });
	const [track, setTrack] = useState<SoundcloudItem | null>(null);

	const isWebContainer = process.env['WEBCONTAINER'];
	const userAgent = process.env['USER_AGENT'] || '';
	const isSafariOrFirefox = userAgent.includes('mobile') || userAgent.includes('gecko/20100101');
	// const compatUrl = 'https://developer.mozilla.org/en-US/docs/Web/Security/IFrame_credentialless#browser_compatibility';
	const warningText = `Your browser likely does not support the necessary features for SoundCloud embeds in this terminal`;
	const warning = `${chalk.yellow('Warning: ' + warningText)}.`;

	useEffect(() => {
		if (!list) {
			const rand = chooseRandom([...(results.tracks || []), ...(results.reposts || []), ...(results.likes || []), ...(results.playlists || [])]);
			rand && setTrack(rand);
		}
	}, [list]);

	useEffect(() => {
		if (isWebContainer && track) {
			const data = {
				ids: [track?.id.toString()],
			};
			writeOsc(80086, data).then(() => exit());
		}
	}, [track, isWebContainer]);

	return (
		<Box flexDirection="column">
			{!list && track && isSafariOrFirefox && <Text>{warning}</Text>}
			{!list && track && <SongList urls={urls} tracks={[track]} />}
			{list && <SongList urls={urls} {...results} />}
		</Box>
	);
}
