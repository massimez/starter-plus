import type {
	ApiResponse,
	ErrorSchema,
	SuccessSchema,
} from "@/middleware/error-handler";
import {
	createErrorResponse,
	createSuccessResponse,
} from "@/middleware/error-handler";

export type { ApiResponse, SuccessSchema, ErrorSchema };
export { createSuccessResponse, createErrorResponse };

export interface PaginatedResponse<T>
	extends Omit<SuccessSchema<T[]>, "error"> {
	pagination: {
		offset: number;
		limit: number;
		total: number;
	};
}

export type OffsetPaginationParams = {
	limit: number;
	offset: number;
	orderBy?: string;
	direction?: "asc" | "desc";
};

/**
 * @deprecated Use createSuccessResponse instead
 * Create success API response
 */
export function createApiResponse<T>(
	data: T,
	message?: string,
): SuccessSchema<T> {
	return createSuccessResponse(data, message);
}

/**
 * @deprecated Use createErrorResponse instead
 * Create error API response
 */
export function createErrorResponseLegacy(
	error: string,
	message?: string,
): ErrorSchema {
	return createErrorResponse(error, message || error, [
		{
			code: error,
			path: [],
			message: message || error,
		},
	]);
}
