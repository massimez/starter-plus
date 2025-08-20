import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ZodError } from "zod";
import { AppError, ValidationError } from "@/types/utility";
export type ErrorSchema = {
	error: {
		issues: {
			code: string;
			path: (string | number)[];
			message?: string | undefined;
		}[];
		name: string;
	};
	success: boolean;
};

export function errorHandler(error: Error, c: Context): Response {
	console.error("Error:", error);

	// Handle Hono HTTP exceptions
	if (error instanceof HTTPException) {
		const response: ErrorSchema = {
			success: false,
			error: {
				name: "HTTPException",
				issues: [
					{
						code: `HTTP_${error.status}`,
						path: [],
						message: error.message,
					},
				],
			},
		};
		return c.json(response, error.status);
	}

	// Handle custom app errors
	if (error instanceof AppError) {
		const response: ErrorSchema = {
			success: false,
			error: {
				name: error.constructor.name,
				issues: [
					{
						code: error.code || "APP_ERROR",
						path:
							error instanceof ValidationError && error.field
								? [error.field]
								: [],
						message: error.message,
					},
				],
			},
		};
		return c.json(response, error.statusCode as ContentfulStatusCode);
	}

	// Handle Zod validation errors
	if (error.name === "ZodError") {
		const zodError = error as ZodError;
		const response: ErrorSchema = {
			success: false,
			error: {
				name: "ZodError",
				issues: zodError.issues?.map((issue) => ({
					code: issue.code || "VALIDATION_ERROR",
					path: issue.path || [],
					message: issue.message,
				})) || [
					{
						code: "VALIDATION_ERROR",
						path: [],
						message: "Validation error",
					},
				],
			},
		};
		return c.json(response, 400);
	}

	// Default error response
	const response: ErrorSchema = {
		success: false,
		error: {
			name: error.name || "InternalError",
			issues: [
				{
					code: "INTERNAL_ERROR",
					path: [],
					message:
						process.env.NODE_ENV === "production"
							? "Internal server error"
							: error.message,
				},
			],
		},
	};

	return c.json(response, 500);
}
