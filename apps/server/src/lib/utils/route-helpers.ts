import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { createErrorResponse } from "@/middleware/error-handler";

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
		return c.json(
			createErrorResponse("BadRequestError", "Organization ID is required", [
				{
					code: "ORGANIZATION_ID_REQUIRED",
					path: ["organizationId"],
					message:
						"The organizationId parameter is required for this operation",
				},
			]),
			400,
		);
	}

	console.error(`Error ${message}:`, error);
	const errorMessage =
		error instanceof Error ? error.message : `Failed to ${message}`;
	const errorCause =
		error instanceof Error && error.cause
			? String(error.cause)
			: `An error occurred while trying to ${message}`;

	return c.json(
		createErrorResponse("InternalServerError", errorMessage, [
			{
				code: "INTERNAL_ERROR",
				path: [],
				message: errorCause,
			},
		]),
		statusCode as ContentfulStatusCode,
	);
};
