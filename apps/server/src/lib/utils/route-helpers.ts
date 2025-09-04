import type { Context, ValidationTargets } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { validator } from "hono/validator";
import z from "zod";

// Helper for standardized error responses
export const handleRouteError = (
	c: Context,
	error: unknown,
	message: string,
	statusCode = 500,
) => {
	if (
		error instanceof Error &&
		error.message === "organizationId is required"
	) {
		return c.json({ error: error.message }, 400);
	}
	console.error(`Error ${message}:`, error);
	return c.json(
		{ error: `Failed to ${message}` },
		statusCode as ContentfulStatusCode,
	);
};
