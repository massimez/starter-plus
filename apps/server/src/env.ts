import { z } from "zod";
import "dotenv/config";

const EnvSchema = z.object({
	NODE_ENV: z.string().default("development"),
	FRONTEND_URL: z.string().default("http://localhost:3000"),
	PORT: z.coerce.number().default(3001),
	// LOG_LEVEL: z.enum([
	//   'fatal',
	//   'error',
	//   'warn',
	//   'info',
	//   'debug',
	//   'trace',
	//   'silent',
	// ]),
	GOOGLE_CLIENT_ID: z.string().optional(),
	GOOGLE_CLIENT_SECRET: z.string().optional(),
});

export type env = z.infer<typeof EnvSchema>;

const { data: env, error } = EnvSchema.safeParse(process.env);

if (error) {
	console.error("❌ Invalid env:");
	console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
	process.exit(1);
}

export default env;
