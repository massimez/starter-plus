import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { envData } from "@/env";
import * as schema from "./schema";

const client = postgres(envData.DATABASE_URL, {
	prepare: false,
	max: process.env.NODE_ENV === "production" ? 20 : 10,
	idle_timeout: 20,
	connect_timeout: 10,
});

export const db = drizzle(client, { schema });
