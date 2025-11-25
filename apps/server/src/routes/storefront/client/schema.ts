import { z } from "zod";
import {
	addressSchema,
	emailSchema,
	languageSchema,
	notesSchema,
	phoneSchema,
	timezoneSchema,
} from "@/routes/admin-organization/store/client/validation";

/**
 * Storefront client update schema
 * Only includes fields that users can safely update themselves
 */
export const storefrontUpdateClientSchema = z.object({
	firstName: z
		.string()
		.min(1, "First name is required")
		.max(100)
		.trim()
		.optional(),
	lastName: z
		.string()
		.min(1, "Last name is required")
		.max(100)
		.trim()
		.optional(),
	email: emailSchema.optional(),
	phone: phoneSchema.optional(),
	addresses: z
		.array(addressSchema)
		.max(10, "Maximum 10 addresses allowed")
		.optional(),
	preferredContactMethod: z.enum(["email", "phone", "sms"]).optional(),
	language: languageSchema.optional(),
	timezone: timezoneSchema.optional(),
	marketingConsent: z.boolean().optional(),
	gdprConsent: z.boolean().optional(),
	notes: notesSchema.optional(),
});

export type StorefrontUpdateClient = z.infer<
	typeof storefrontUpdateClientSchema
>;
