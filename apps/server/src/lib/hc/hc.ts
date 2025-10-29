import { hc } from "hono/client";

import type { App } from "../app";

const client = hc<App>("");
export type Client = typeof client;

export const hcWithType = (...args: Parameters<typeof hc>): Client =>
	hc<App>(...args);
