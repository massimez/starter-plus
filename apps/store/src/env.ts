import { z } from "zod";

const EnvSchema = z.object({
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),
	NEXT_PUBLIC_API_BASE_URL: z.url(),
	NEXT_PUBLIC_APP_URL: z.url(),
	ANALYZE: z.string().optional(),
	NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
	REMOTE_PATTERNS: z
		.string()
		.optional()
		.transform((val) => {
			if (!val) return [];
			try {
				return JSON.parse(val);
			} catch {
				return [];
			}
		})
		.pipe(
			z.array(
				z.object({
					protocol: z.enum(["http", "https"]).optional(),
					hostname: z.string(),
					port: z.string().optional(),
					pathname: z.string().optional(),
				}),
			),
		),
});

export type env = z.infer<typeof EnvSchema>;

const runtimeEnv = {
	NODE_ENV: process.env.NODE_ENV,
	NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
	NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
	ANALYZE: process.env.ANALYZE,
	NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
	REMOTE_PATTERNS: process.env.REMOTE_PATTERNS,
};

const envResult = EnvSchema.safeParse(runtimeEnv);

if (!envResult.success) {
	console.error("❌ Invalid env:");
	console.error(JSON.stringify(envResult.error.flatten().fieldErrors, null, 2));
	process.exit(1);
}

export const envData = envResult.data;
