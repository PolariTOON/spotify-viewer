import type {IncomingMessage, Server, ServerResponse} from "node:http";
import fs from "node:fs/promises";
import http from "node:http";
import url from "node:url";
type Entry = {
	pathname: string,
	contentType: string,
};
type EntryMap = {[k in string]?: Entry};
const base: string = import.meta.url;
const root: string = base.slice(0, base.lastIndexOf("/"));
const entryMap: EntryMap = Object.assign(Object.create(null), {
	"/": {
		pathname: "/index.html",
		contentType: "text/html; charset=utf-8",
	},
	"/favicon.ico": {
		pathname: "/favicon.svg",
		contentType: "image/svg+xml; charset=utf-8",
	},
	"/index.css": {
		pathname: "/index.css",
		contentType: "text/css; charset=utf-8",
	},
	"/index.js": {
		pathname: "/index.js",
		contentType: "text/javascript; charset=utf-8",
	},
});
const port: number = 3000;
const origin: string = `http://127.0.0.1:${port}/`;
const server: Server = http.createServer(async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
	const outerPath: string | undefined = request.url;
	let content: string | Buffer;
	let contentType: string;
	try {
		if (outerPath == null) {
			throw new Error("No URL");
		}
		const outerPathname: string = new URL(outerPath, origin).pathname;
		const entry: Entry | undefined = entryMap[outerPathname];
		if (entry == null) {
			throw new Error("Invalid entry");
		}
		const innerPathname: string = entry.pathname;
		const innerPath: string = url.fileURLToPath(`${root}/../../front/bin/${innerPathname}`);
		content = await fs.readFile(innerPath);
		contentType = entry.contentType;
		response.statusCode = 200;
		console.log(`${outerPathname} -> ${innerPathname}`);
	} catch (error: unknown) {
		content = "500 Internal Server Error";
		contentType = "text/plain; charset=utf-8";
		response.statusCode = 500;
		block: {
			if (error != null && typeof error === "object" && "message" in error) {
				const message: unknown = error.message;
				if (typeof message === "string") {
					console.warn(`${outerPath}: ${message}`);
					break block;
				}
			}
			console.warn(`${outerPath}: Unknown error`);
		}
	}
	response.setHeader("content-type", contentType);
	response.end(content);
});
server.listen(port, () => {
	console.log(`Server listening on port ${port} (${origin})`);
});
