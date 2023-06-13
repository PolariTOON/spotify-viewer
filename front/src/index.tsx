import type {LazyExoticComponent} from "react";
import type {Root} from "react-dom/client";
import type {TracksItem, TracksItemTrackAlbum, TracksItemTrackAlbumImage} from "./index.helpers.ts";
import React, {Suspense, lazy} from "react";
import {createRoot} from "react-dom/client";
import {authorize, listSavedTracks} from "./index.helpers.ts";
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
const Image: ({image, name}: ImageProps) => JSX.Element = ({image, name}: ImageProps): JSX.Element => {
	const url: string = image.url;
	const width: number | null = image.width;
	const height: number | null = image.height;
	return <>
		<p>
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
			<p>Les {items.length} musiques Spotify ont été chargées</p>
			{
				items.length !== 0 && <>
					<Album album={items[0].track.album} />
				</>
			}
		</>;
	}
	return {
		default: Library,
	};
});
const Loading: ({}: LoadingProps) => JSX.Element = ({}: LoadingProps): JSX.Element => {
	return <>
		<p>Chargement en cours</p>
	</>;
};
const Viewer: ({}: ViewerProps) => JSX.Element = ({}: ViewerProps): JSX.Element => {
	return <>
		<h1>Visionneuse Spotify</h1>
		<Suspense fallback={<Loading />}>
			<Library />
		</Suspense>
	</>;
};
const container: HTMLElement = document.body;
const root: Root = createRoot(container);
root.render(<Viewer/>);
