import { defineConfig } from "drizzle-kit";
import { envData } from "@/env";

export default defineConfig({
	schema: "./src/lib/db/schema",
	out: "./src/lib/db/migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: envData.DATABASE_URL || "",
	},
});
