import type {LazyExoticComponent} from "react";
import type {Root} from "react-dom/client";
import type {TracksItem, TracksItemTrack, TracksItemTrackAlbum, TracksItemTrackAlbumImage} from "./index.helpers.ts";
import React, {Fragment, Suspense, lazy, useState} from "react";
import {createRoot} from "react-dom/client";
import {addSavedTrack, authorize, listSavedTracks, removeSavedTrack} from "./index.helpers.ts";
type TrackProps = {
	track: TracksItemTrack,
};
type ImageProps = {
	image: TracksItemTrackAlbumImage,
	name: string,
};
type AlbumProps = {
	album: TracksItemTrackAlbum,
};
type LibraryProps = {};
type LoadingProps = {};
type ViewerProps = {};
const accessToken: string | null = await authorize();
if (accessToken == null) {
	throw new Error("No access token");
}
const Track: ({track}: TrackProps) => JSX.Element = ({track}: TrackProps): JSX.Element => {
	const [disabled, setDisabled]: [boolean, (liked: boolean) => void] = useState(false);
	const [liked, setLiked]: [boolean, (liked: boolean) => void] = useState(true);
	const unlike: () => Promise<void> = async (): Promise<void> => {
		setDisabled(true);
		try {
			await removeSavedTrack(accessToken, track.id);
			setLiked(false);
		} catch (error: unknown) {
			block: {
				if (error != null && typeof error === "object" && "message" in error) {
					const message: unknown = error.message;
					if (typeof message === "string") {
						console.warn(message);
						break block;
					}
				}
				console.warn("Unknown error");
			}
		}
		setDisabled(false);
	};
	const like: () => Promise<void> = async (): Promise<void> => {
		setDisabled(true);
		try {
			await addSavedTrack(accessToken, track.id);
			setLiked(true);
		} catch (error: unknown) {
			block: {
				if (error != null && typeof error === "object" && "message" in error) {
					const message: unknown = error.message;
					if (typeof message === "string") {
						console.warn(message);
						break block;
					}
				}
				console.warn("Unknown error");
			}
		}
		setDisabled(false);
	};
	return <>
		<p className="name">{track.name}</p>
		<menu className="context">
			<li>
				<p className="action">
					<button
						type="button"
						value=""
						disabled={disabled}
						onClick={liked ? unlike : like}
					>
						{
							liked ? <>
								Enlever des Titres likés
							</> : <>
								Ajouter aux Titres likés
							</>
						}
					</button>
				</p>
			</li>
		</menu>
	</>;
};
const Image: ({image, name}: ImageProps) => JSX.Element = ({image, name}: ImageProps): JSX.Element => {
	const url: string = image.url;
	const width: number | null = image.width;
	const height: number | null = image.height;
	return <>
		<p className="cover">
			<picture>
				<img
					{...(width != null ? {width} : {})}
					{...(height != null ? {height} : {})}
					alt={`Couverture de ${name}`}
					src={url}
					loading="lazy"
				/>
			</picture>
		</p>
	</>
};
const Album: ({album}: AlbumProps) => JSX.Element = ({album}: AlbumProps): JSX.Element => {
	const images: TracksItemTrackAlbumImage[] = album.images;
	const name: string = album.name;
	return <>
		{
			images.length != 0 && <>
				<Image image={images[0]} name={name} />
			</>
		}
	</>;
};
const Library: LazyExoticComponent<({}: LibraryProps) => JSX.Element> = lazy(async (): Promise<{default: ({}: LibraryProps) => JSX.Element}> => {
	// const items: TracksItem[] = await Array.fromAsync(listSavedTracks(accessToken));
	const items: TracksItem[] = [];
	for await (const item of listSavedTracks(accessToken)) {
		items.push(item);
	}
	function Library({}: LibraryProps): JSX.Element {
		return <>
			<p className="status">Les {items.length} musiques Spotify ont été chargées</p>
			{
				items.length !== 0 && <>
					<Album album={items[0].track.album} />
				</>
			}
			<ul className="list">
				{items.map((item: TracksItem): JSX.Element => {
					return <Fragment key={item.track.id}>
						<li>
							<Track track={item.track} />
						</li>
					</Fragment>;
				})}
			</ul>
		</>;
	}
	return {
		default: Library,
	};
});
const Loading: ({}: LoadingProps) => JSX.Element = ({}: LoadingProps): JSX.Element => {
	return <>
		<p className="status">Chargement en cours</p>
	</>;
};
const Viewer: ({}: ViewerProps) => JSX.Element = ({}: ViewerProps): JSX.Element => {
	return <>
		<h1 className="title">Visionneuse Spotify</h1>
		<Suspense fallback={<Loading />}>
			<Library />
		</Suspense>
	</>;
};
const container: HTMLElement = document.body;
const root: Root = createRoot(container);
root.render(<Viewer/>);
