// apps/api/src/index.ts

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";

import { errorHandler } from "@/middleware/error-handler";
import { rateLimiter } from "@/middleware/rate-limiter";
import type { AuthType } from "@/types";
import env from "../env";

export function createRouter() {
	return new Hono<{ Variables: AuthType }>({
		strict: false,
	});
}

export default function createApp() {
	const app = createRouter();

	// Root route
	// app.get("/", (c) => {
	// 	return c.json({
	// 		message: "Full-stack Monorepo API",
	// 		version: "1.0.0",
	// 		status: "healthy",
	// 		timestamp: new Date().toISOString(),
	// 	});
	// });

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
			allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
			allowHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
		}),
	);

	app.notFound((c) => {
		return c.json(
			{
				success: false,
				error: "Not Found",
				message: "The requested resource was not found",
			},
			404,
		);
	});
	app.onError(errorHandler);

	return app;
}
