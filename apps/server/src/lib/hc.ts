import { hc } from "hono/client";
import type { App } from "./app"; // or "../lib/app" depending on structure

const client = hc<App>("");
export type Client = typeof client;

export const hcWithType = (...args: Parameters<typeof hc>): Client =>
	hc<App>(...args);
