# Spotify viewer

Spotify user saved tracks viewer app

## Registering the app

Register the app on Spotify's dashboard and add `http://127.0.0.1:3000/` as a redirect URI.

## Configuring the app

Define `SPOTIFY_VIEWER_CLIENT_ID` as the client ID found on the dashboard.

```shell
$ export SPOTIFY_VIEWER_CLIENT_ID=<your-spotify-viewer-client-id-here>
```

## Linting the app

Check types.

```shell
$ npm run lint
```

## Building the app

Compile both the back-end and the front-end.

```shell
$ npm run build
```

## Starting the app

Run the server then open the link.

```shell
$ npm start
```
