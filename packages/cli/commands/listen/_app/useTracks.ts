import { json } from '@jsnix/scripts/scrape';
import type { ListResponse } from '@jsnix/scripts/soundcloud/scrape';

export type UseTracksProps = {
	tracks?: boolean;
	reposts?: boolean;
	likes?: boolean;
	playlists?: boolean;
};

export const useTracks = ({ tracks, reposts, likes, playlists }: UseTracksProps): ListResponse => {
	return {
		tracks: tracks ? json.tracks : [],
		reposts: reposts ? json.reposts : [],
		likes: likes ? json.likes : [],
		playlists: playlists ? json.playlists : [],
	};
};
