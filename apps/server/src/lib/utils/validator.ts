import { validator } from "hono/validator";
import { z } from "zod";

// Helper function to validate organization ID
export const validateOrgId = (orgId: string | undefined) => {
	if (!orgId) {
		throw new Error("organizationId is required");
	}
	return orgId;
};

export const queryOrgIdSchema = z.object({
	organizationId: z.string().min(1, "organizationId is required"),
});

// Factory for query parameter validators
export const queryValidator = <T extends z.ZodSchema>(schema: T) => {
	return validator("query", (value, c) => {
		const parsed = schema.safeParse(value);
		if (!parsed.success) {
			return c.json(
				{ error: "Invalid query parameters", details: parsed.error },
				400,
			);
		}
		return parsed.data;
	});
};

// Factory for JSON body validators
export const jsonValidator = <T extends z.ZodSchema>(schema: T) => {
	return validator("json", (value, c) => {
		const parsed = schema.safeParse(value);
		if (!parsed.success) {
			return c.json({ error: "Invalid JSON body", details: parsed.error }, 400);
		}
		return parsed.data;
	});
};

// Factory for form data validators
export const formValidator = <T extends z.ZodSchema>(schema: T) => {
	return validator("form", (value, c) => {
		const parsed = schema.safeParse(value);
		if (!parsed.success) {
			return c.json({ error: "Invalid form data", details: parsed.error }, 400);
		}
		return parsed.data;
	});
};

// Factory for URL parameter validators
export const paramValidator = <T extends z.ZodSchema>(schema: T) => {
	return validator("param", (value, c) => {
		const parsed = schema.safeParse(value);
		if (!parsed.success) {
			return c.json(
				{ error: "Invalid URL parameters", details: parsed.error },
				400,
			);
		}
		return parsed.data;
	});
};

// Factory for header validators
export const headerValidator = <T extends z.ZodSchema>(schema: T) => {
	return validator("header", (value, c) => {
		const parsed = schema.safeParse(value);
		if (!parsed.success) {
			return c.json({ error: "Invalid headers", details: parsed.error }, 400);
		}
		return parsed.data;
	});
};

// Factory for cookie validators
export const cookieValidator = <T extends z.ZodSchema>(schema: T) => {
	return validator("cookie", (value, c) => {
		const parsed = schema.safeParse(value);
		if (!parsed.success) {
			return c.json({ error: "Invalid cookies", details: parsed.error }, 400);
		}
		return parsed.data;
	});
};
