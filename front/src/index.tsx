import type {LazyExoticComponent} from "react";
import type {Root} from "react-dom/client";
import type {TracksItem} from "./index.helpers.ts";
import React, {Suspense, lazy} from "react";
import {createRoot} from "react-dom/client";
import {authorize, listSavedTracks} from "./index.helpers.ts";
type LibraryProps = {};
type LoadingProps = {};
type ViewerProps = {};
const accessToken: string | null = await authorize();
if (accessToken == null) {
	throw new Error("No access token");
}
const Library: LazyExoticComponent<({}: LibraryProps) => JSX.Element> = lazy(async (): Promise<{default: ({}: LibraryProps) => JSX.Element}> => {
	// const items: TracksItem[] = await Array.fromAsync(listSavedTracks(accessToken));
	const items: TracksItem[] = [];
	for await (const item of listSavedTracks(accessToken)) {
		items.push(item);
	}
	function Library({}: LibraryProps): JSX.Element {
		return <>
			<p>Les musiques Spotify ont été chargées</p>
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
