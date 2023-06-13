type TokenError = {
	error_description: string,
};
type Token = {
	access_token: string,
};
type TracksErrorError = {
	message: string,
};
type TracksError = {
	error: TracksErrorError,
};
export type TracksItemTrackAlbumImage = {
	height: number | null,
	width: number | null,
	url: string,
};
export type TracksItemTrackAlbum = {
	images: TracksItemTrackAlbumImage[],
	name: string,
};
export type TracksItemTrack = {
	album: TracksItemTrackAlbum,
	id: string,
	name: string,
};
export type TracksItem = {
	track: TracksItemTrack,
};
type Tracks = {
	items: TracksItem[],
	next: string | null,
};
declare const SPOTIFY_VIEWER_CLIENT_ID: string;
function generateCodeVerifier(): string {
	const characterSet: string = "-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz~";
	const characterSetSize: number = characterSet.length;
	let codeVerifier: string = "";
	for (let k: number = 0; k < 128; ++k) {
		codeVerifier += characterSet.charAt(Math.floor(Math.random() * characterSetSize));
	}
	return codeVerifier;
}
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
	const encodedCodeVerifier: Uint8Array = new TextEncoder().encode(codeVerifier);
	const encodedCodeChallenge: Uint8Array = new Uint8Array(await window.crypto.subtle.digest("SHA-256", encodedCodeVerifier));
	const codeChallenge: string = String.fromCharCode(...encodedCodeChallenge);
	return codeChallenge;
}
function requestAuthorization(clientId: string, redirectUrl: string, codeChallenge: string): void {
	const url: string = "https://accounts.spotify.com/authorize";
	const encodedCodeChallenge: string = btoa(codeChallenge).replace(/={1,2}$/, "").replaceAll("+", "-").replaceAll("/", "_");
	const query: URLSearchParams = new URLSearchParams({
		"client_id": clientId,
		"code_challenge": encodedCodeChallenge,
		"code_challenge_method": "S256",
		"scope": "user-library-modify user-library-read",
		"redirect_uri": redirectUrl,
		"response_type": "code",
	});
	location.href = `${url}?${query}`;
}
async function acknowledgeAuthorization(clientId: string, redirectUrl: string, codeVerifier: string, code: string): Promise<Token> {
	const url: string = "https://accounts.spotify.com/api/token";
	const query: URLSearchParams = new URLSearchParams({
		"client_id": clientId,
		"code": code,
		"code_verifier": codeVerifier,
		"grant_type": "authorization_code",
		"redirect_uri": redirectUrl,
	});
	const response: Response = await fetch(url, {
			body: query,
			headers: {
				"content-type": "application/x-www-form-urlencoded",
			},
			method: "POST",
	});
	if (!response.ok) {
		const json: TokenError = await response.json();
		throw new Error(json.error_description);
	}
	const json: Token = await response.json();
	return json;
}
export async function authorize(): Promise<string | null> {
	const clientId: string = SPOTIFY_VIEWER_CLIENT_ID;
	const redirectUrl: string = `${location.origin}${location.pathname}`;
	const query: URLSearchParams = new URLSearchParams(location.search);
	const code: string | null = query.get("code");
	if (code != null) {
		query.delete("code");
		history.replaceState(null, "", `${redirectUrl}?${query}`);
		const codeVerifier: string | null = sessionStorage.getItem("spotify_viewer_code_verifier");
		if (codeVerifier != null) {
			sessionStorage.removeItem("spotify_viewer_code_verifier");
			const accessToken: string = (await acknowledgeAuthorization(clientId, redirectUrl, codeVerifier, code)).access_token;
			return accessToken;
		}
	}
	const codeVerifier: string = generateCodeVerifier();
	const codeChallenge: string = await generateCodeChallenge(codeVerifier);
	sessionStorage.setItem("spotify_viewer_code_verifier", codeVerifier);
	requestAuthorization(clientId, redirectUrl, codeChallenge);
	return null;
}
export async function* listSavedTracks(accessToken: string): AsyncGenerator<TracksItem, void, undefined> {
	let url: string | null = "https://api.spotify.com/v1/me/tracks";
	do {
		const response: Response = await fetch(url, {
			headers: {
				"authorization": `Bearer ${accessToken}`,
			},
		});
		if (!response.ok) {
			const json: TracksError = await response.json();
			throw new Error(json.error.message);
		}
		const json: Tracks = await response.json();
		yield* json.items;
		url = json.next;
	} while (url != null);
}
export async function removeSavedTrack(accessToken: string, id: string): Promise<void> {
	const url: string = "https://api.spotify.com/v1/me/tracks";
	const query: string = JSON.stringify({
		ids: [id],
	});
	const response: Response = await fetch(url, {
		body: query,
		headers: {
			"authorization": `Bearer ${accessToken}`,
			"content-type": "application/json",
		},
		method: "DELETE",
	});
	if (!response.ok) {
		const json: TracksError = await response.json();
		throw new Error(json.error.message);
	}
}
export async function addSavedTrack(accessToken: string, id: string): Promise<void> {
	const url: string = "https://api.spotify.com/v1/me/tracks";
	const query: string = JSON.stringify({
		ids: [id],
	});
	const response: Response = await fetch(url, {
		body: query,
		headers: {
			"authorization": `Bearer ${accessToken}`,
			"content-type": "application/json",
		},
		method: "PUT",
	});
	if (!response.ok) {
		const json: TracksError = await response.json();
		throw new Error(json.error.message);
	}
}
