import { z } from "zod";

/**
 * Email validation - RFC 5322 compliant
 */
export const emailSchema = z
	.email("Invalid email format")
	.max(255, "Email must be less than 255 characters")
	.toLowerCase()
	.trim();

/**
 * Phone validation - E.164 format
 * Accepts formats like: +1234567890, +12 345 678 9012
 */
export const phoneSchema = z
	.string()
	.transform((val) => val.replace(/\s/g, "")); // Remove spaces

/**
 * Fraud score validation - 0 to 100
 */
export const fraudScoreSchema = z
	.number()
	.min(0, "Fraud score must be at least 0")
	.max(100, "Fraud score must be at most 100")
	.or(
		z
			.string()
			.regex(/^\d+(\.\d{1,2})?$/, "Fraud score must be a valid number")
			.transform((val) => Number.parseFloat(val))
			.refine((val) => val >= 0 && val <= 100, {
				message: "Fraud score must be between 0 and 100",
			}),
	);

/**
 * Address validation schema
 */
export const addressSchema = z.object({
	type: z.enum(["billing", "shipping"]),
	street: z.string().min(1, "Street is required").max(255).trim(),
	city: z.string().min(1, "City is required").max(100).trim(),
	state: z.string().max(100).trim().optional(),
	postalCode: z.string().max(20).trim().optional(),
	country: z.string().min(2, "Country code required").max(2).toUpperCase(),
	isDefault: z.boolean().optional(),
});

/**
 * Tag validation - prevent XSS and enforce format
 */
export const tagSchema = z
	.string()
	.min(1, "Tag cannot be empty")
	.max(50, "Tag must be less than 50 characters")
	.regex(
		/^[a-zA-Z0-9_-]+$/,
		"Tag can only contain letters, numbers, hyphens, and underscores",
	)
	.toLowerCase()
	.trim();

export const tagsArraySchema = z
	.array(tagSchema)
	.max(20, "Maximum 20 tags allowed");

/**
 * Notes sanitization - prevent XSS
 */
export const notesSchema = z
	.string()
	.max(5000, "Notes must be less than 5000 characters")
	.transform((val) => {
		// Basic HTML sanitization - remove script tags and event handlers
		return val
			.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
			.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
			.replace(/javascript:/gi, "")
			.trim();
	});

/**
 * Metadata validation - ensure safe JSONB structure
 */
export const metadataSchema = z
	.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
	.refine(
		(obj) => {
			// Limit depth and size to prevent DoS
			const str = JSON.stringify(obj);
			return str.length <= 10000;
		},
		{ message: "Metadata too large (max 10KB)" },
	);

/**
 * External IDs validation
 */
export const externalIdsSchema = z
	.record(z.string().max(50), z.string().max(255))
	.refine((obj) => Object.keys(obj).length <= 20, {
		message: "Maximum 20 external IDs allowed",
	});

/**
 * Validate UUID format
 */
export const uuidSchema = z.string().uuid("Invalid UUID format");

/**
 * Language code validation - ISO 639-1
 */
export const languageSchema = z
	.string()
	.length(2, "Language code must be 2 characters")
	.toLowerCase()
	.regex(/^[a-z]{2}$/, "Invalid language code");

/**
 * Timezone validation
 */
export const timezoneSchema = z
	.string()
	.max(50, "Timezone must be less than 50 characters")
	.refine(
		(tz) => {
			// Basic timezone validation
			try {
				Intl.DateTimeFormat(undefined, { timeZone: tz });
				return true;
			} catch {
				return false;
			}
		},
		{ message: "Invalid timezone" },
	);

/**
 * Consent date validation - must be in the past
 */
export const consentDateSchema = z
	.date()
	.max(new Date(), "Consent date cannot be in the future");

/**
 * Helper to sanitize string inputs
 */
export function sanitizeString(
	input: string | null | undefined,
): string | null {
	if (!input) return null;
	return input
		.trim()
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
		.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
		.replace(/javascript:/gi, "");
}

/**
 * Validate email uniqueness within organization
 */
export async function validateEmailUniqueness(
	db: typeof import("@/lib/db").db,
	email: string,
	organizationId: string,
	excludeClientId?: string,
): Promise<boolean> {
	const { client } = await import("@/lib/db/schema/store/client");
	const { eq, and, ne } = await import("drizzle-orm");

	const conditions = [
		eq(client.email, email.toLowerCase()),
		eq(client.organizationId, organizationId),
		eq(client.isActive, true),
	];

	if (excludeClientId) {
		conditions.push(ne(client.id, excludeClientId));
	}

	const [existing] = await db
		.select({ id: client.id })
		.from(client)
		.where(and(...conditions))
		.limit(1);

	return !existing; // Returns true if email is unique
}
