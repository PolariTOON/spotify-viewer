import {authorize} from "./index.helpers.ts";
const accessToken: string | null = await authorize();
if (accessToken == null) {
	throw new Error("No access token");
}
