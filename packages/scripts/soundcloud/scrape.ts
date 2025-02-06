import data from './scrape.json' with { type: 'json' };
export const json = data;

export type SoundcloudResponse<T extends any[]> = {
	collection: T;
	next_href: string | null;
};
export type User = {
	username: string;
	id: number;
};
export type SoundcloudItem = {
	id: number;
	permalink_url: string;
	title: string;
	user: User;
};
export type Playlist = SoundcloudItem & {
	kind: 'playlist';
};
export type Track = SoundcloudItem & {
	embeddable_by: string;
};
export type Repost = {
	type: 'track-repost' | 'playlist-repost';
	user: User;
	track?: Track;
	playlist?: Playlist;
};
export type Like = {
	kind: 'like';
	track?: Track;
	playlist?: Playlist;
};
export type ListResponse = { tracks?: SoundcloudItem[]; reposts?: SoundcloudItem[]; playlists?: SoundcloudItem[]; likes?: SoundcloudItem[] };

export class Soundcloud {
	private clientId: string;
	private oauthToken: string;
	private readonly baseHeaders: Record<string, string>;

	constructor(clientId: string, oauthToken: string) {
		this.clientId = clientId;
		this.oauthToken = oauthToken;
		this.baseHeaders = {
			Authorization: `OAuth ${this.oauthToken}`,
		};
	}

	private async fetchAllPages<T extends any[]>(url: string | null): Promise<any[]> {
		const results: any[] = [];

		while (url) {
			// Add a delay of 1 second between requests
			console.log('sleeping for 1 second before request');
			await new Promise((resolve) => setTimeout(resolve, 1000));
			const response = await fetch(url + `&client_id=${this.clientId}`, { headers: this.baseHeaders });

			if (response.status == 404) {
				console.error(`Not found: ${response.url}`);
				return results;
			}

			if (!response.ok) {
				throw new Error(`Failed to fetch: ${response.statusText}: ${response.url}`);
			}

			const data: SoundcloudResponse<T> = await response.json();
			results.push(...(data.collection || []));
			url = data.next_href || null;
		}

		return results;
	}

	async listTracks(userId: string): Promise<Track[]> {
		const url = `https://api-v2.soundcloud.com/users/${userId}/tracks?limit=200`;
		return this.fetchAllPages<Track[]>(url);
	}

	async listReposts(userId: string): Promise<Repost[]> {
		const url = `https://api-v2.soundcloud.com/stream/users/${userId}/reposts?limit=200`;
		return this.fetchAllPages<Repost[]>(url);
	}

	async listPlaylists(userId: string): Promise<Playlist[]> {
		const url = `https://api-v2.soundcloud.com/users/${userId}/playlists?limit=200`;
		return this.fetchAllPages<Playlist[]>(url);
	}

	async listLiked(userId: string): Promise<Like[]> {
		const url = `https://api-v2.soundcloud.com/users/${userId}/likes?limit=200`;
		return this.fetchAllPages<Like[]>(url);
	}

	async list(
		userId: string,
		options: {
			tracks?: boolean;
			reposts?: boolean;
			playlists?: boolean;
			likes?: boolean;
		},
	): Promise<ListResponse> {
		const results: any = {};

		if (options.tracks) {
			const tracks = await this.listTracks(userId);
			results.tracks = tracks.map(({ id, title, embeddable_by, permalink_url, user }) => ({ id, title, embeddable_by, permalink_url, user: { id: user.id, username: user.username } }));
		}

		if (options.reposts) {
			const reposts = await this.listReposts(userId);
			results.reposts = reposts.map(({ track, playlist }) => {
				if (track) {
					const { id, title, embeddable_by, permalink_url, user } = track;
					return { id, title, embeddable_by, permalink_url, user: { id: user.id, username: user.username } };
				}

				if (playlist) {
					const { id, title, permalink_url, user } = playlist;
					return { id, title, permalink_url, user: { id: user.id, username: user.username } };
				}
				return null;
			}).filter((a) => a !== null);
		}

		if (options.playlists) {
			const playlists = await this.listPlaylists(userId);
			results.playlists = playlists.map(({ id, title, permalink_url, user }) => ({ id, title, permalink_url, user: { id: user.id, username: user.username } }));
		}

		if (options.likes) {
			const likes = await this.listLiked(userId);
			results.likes = likes.map((like) => {
				if (like.track) {
					const { id, title, embeddable_by, permalink_url, user } = like.track;
					return { id, title, embeddable_by, permalink_url, user: { id: user.id, username: user.username } };
				}

				if (like.playlist) {
					const { id, title, permalink_url, user } = like.playlist;
					return { id, title, permalink_url, user: { id: user.id, username: user.username } };
				}
				return null;
			}).filter((a) => a !== null);
		}

		return results;
	}
}
