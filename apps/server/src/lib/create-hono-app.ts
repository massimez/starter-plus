// apps/api/src/index.ts

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { errorHandler } from "@/middleware/error-handler";
import { rateLimiter } from "@/middleware/rate-limiter";
import env from "../env";
import type { auth } from "../lib/auth";

export function createRouter() {
	return new Hono<{
		Variables: {
			user: typeof auth.$Infer.Session.user | null;
			session: typeof auth.$Infer.Session.session | null;
		};
	}>({
		strict: false,
	});
}

export default function createApp() {
	const app = createRouter();

	// Middleware
	app.use("*", logger());
	app.use("*", prettyJSON());
	app.use("*", secureHeaders());
	app.use("*", rateLimiter());

	// CORS configuration
	app.use(
		"*",
		cors({
			origin:
				process.env.NODE_ENV === "production"
					? [env?.FRONTEND_URL || "http://localhost:3000"]
					: ["http://localhost:3000", "http://127.0.0.1:3000"],
			credentials: true,
			allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
			allowHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
		}),
	);

	app.notFound((c) => {
		return c.json(
			{
				success: false,
				error: {
					name: "NotFound",
					message: "The requested resource was not found",
					issues: [
						{
							code: "NOT_FOUND",
							path: [],
							message: "The requested resource was not found",
						},
					],
				},
				data: null,
			},
			404,
		);
	});
	app.onError(errorHandler);

	return app;
}
