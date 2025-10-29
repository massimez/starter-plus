import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Disable prefetch as it is not supported for "Transaction" pool mode
console.log("DATABASE_URL is d", process.env.DATABASE_URL);
// biome-ignore lint/style/noNonNullAssertion: <res>
const client = postgres(process.env.DATABASE_URL!, {
	prepare: false,
	max: 10,
	idle_timeout: 20,
	connect_timeout: 10,
});

export const db = drizzle(client, { schema });
