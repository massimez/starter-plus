// ============================================================================
// ERROR TYPES - Single source of truth
// ============================================================================

export type ErrorSchema = {
	success: false;
	error: {
		name: string;
		message: string;
		issues: Array<{
			code: string;
			path: (string | number)[];
			message: string;
		}>;
	};
	data?: null;
};

export type SuccessSchema<T> = {
	success: true;
	data: T;
	error?: null;
};

export type ApiResponse<T> = SuccessSchema<T> | ErrorSchema;

// ============================================================================
// ERROR UTILITIES - Centralized error formatting
// ============================================================================

import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ZodError } from "zod";
import { AppError, ValidationError } from "@/types/utility";

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
	name: string,
	message: string,
	issues: ErrorSchema["error"]["issues"],
): ErrorSchema {
	return {
		success: false,
		error: {
			name,
			message,
			issues,
		},
		data: null,
	};
}

/**
 * Converts Zod errors to standardized format
 */
export function zodErrorToResponse(zodError: ZodError): ErrorSchema {
	return createErrorResponse(
		"ValidationError",
		"Validation failed",
		zodError.issues.map((issue) => ({
			code: issue.code,
			path: issue.path as (string | number)[],
			message: issue.message,
		})),
	);
}

// ============================================================================
// ERROR HANDLER - Global error handling middleware
// ============================================================================

export function errorHandler(error: Error, c: Context): Response {
	console.error("Error:", error);

	// Handle Hono HTTP exceptions
	if (error instanceof HTTPException) {
		const response = createErrorResponse("HTTPException", error.message, [
			{
				code: `HTTP_${error.status}`,
				path: [],
				message: error.message,
			},
		]);
		return c.json(response, error.status);
	}

	// Handle custom app errors
	if (error instanceof AppError) {
		const response = createErrorResponse(
			error.constructor.name,
			error.message,
			[
				{
					code: error.code || "APP_ERROR",
					path:
						error instanceof ValidationError && error.field
							? [error.field]
							: [],
					message: error.message,
				},
			],
		);
		return c.json(response, error.statusCode as ContentfulStatusCode);
	}

	// Handle Zod validation errors
	if (error.name === "ZodError") {
		const response = zodErrorToResponse(error as ZodError);
		return c.json(response, 400);
	}

	// Default error response
	const response = createErrorResponse(
		error.name || "InternalError",
		process.env.NODE_ENV === "production"
			? "Internal server error"
			: error.message,
		[
			{
				code: "INTERNAL_ERROR",
				path: [],
				message:
					process.env.NODE_ENV === "production"
						? "Internal server error"
						: error.message,
			},
		],
	);

	return c.json(response, 500);
}
