import { z } from "zod";

const EnvSchema = z.object({
	NODE_ENV: z.string().default("development"),
	FRONTEND_URL: z.string().default("http://localhost:3001"),
	PORT: z.coerce.number().default(3001),
	DATABASE_URL: z.string(),
	BETTER_AUTH_URL: z.string().default("http://localhost:3001"),
	BETTER_AUTH_SECRET: z.string().min(32),
	CF_ACCOUNT_ID: z.string().optional(),
	CF_ACCESS_KEY_ID: z.string().optional(),
	CF_SECRET_ACCESS_KEY: z.string().optional(),
	CF_BUCKET_NAME: z.string().optional(),
	CDN_BASE_URL: z.string().optional(),
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
	RESEND_KEY: z.string().optional(),
	REDIS_URL: z.url().default("redis://localhost:6379"),
	REDIS_PREFIX: z.string().default("app"),
});

export type env = z.infer<typeof EnvSchema>;

const envResult = EnvSchema.safeParse(process.env);

if (!envResult.success) {
	console.error("❌ Invalid env:");
	console.error(JSON.stringify(envResult.error.flatten().fieldErrors, null, 2));
	process.exit(1);
}

export const envData = envResult.data;
