// ============================================================================
// VALIDATORS - Using unified error format
// ============================================================================

import { validator } from "hono/validator";
import { z } from "zod";
import { zodErrorToResponse } from "@/middleware/error-handler";

/**
 * Generic validator factory that returns standardized errors with proper types
 */
const createValidator = <
	Type extends "query" | "json" | "form" | "param" | "header" | "cookie",
>(
	type: Type,
) => {
	return <T extends z.ZodSchema>(schema: T) => {
		return validator(type, (value, c) => {
			const parsed = schema.safeParse(value);
			if (!parsed.success) {
				return c.json(zodErrorToResponse(parsed.error), 400);
			}
			return parsed.data as z.infer<T>;
		});
	};
};

export const queryValidator = createValidator("query");
// Factory for JSON body validators
export const jsonValidator = <T extends z.ZodSchema>(schema: T) => {
	return validator("json", (value, c) => {
		const parsed = schema.safeParse(value);
		if (!parsed.success) {
			return c.json(zodErrorToResponse(parsed.error), 400);
		}
		return parsed.data;
	});
};

export const formValidator = createValidator("form");
export const paramValidator = createValidator("param");
export const headerValidator = createValidator("header");
export const cookieValidator = createValidator("cookie");

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const queryOrgIdSchema = z.object({
	organizationId: z.string().min(1, "organizationId is required"),
});

export const idParamSchema = z.object({
	id: z.string().min(1, "id is required"),
});

/**
 * Helper function to validate organization ID
 */
export const validateOrgId = (orgId: string | undefined): string => {
	if (!orgId) {
		throw new Error("organizationId is required");
	}
	return orgId;
};
