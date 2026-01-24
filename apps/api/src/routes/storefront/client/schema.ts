import { z } from "zod";
import {
	emailSchema,
	languageSchema,
	notesSchema,
	phoneSchema,
	timezoneSchema,
} from "@/routes/admin-organization/store/client/validation";

// Local address schema with optional fields for storefront updates
const storefrontAddressSchema = z.object({
	type: z.enum(["billing", "shipping"]),
	street: z.string().max(255).trim().optional(),
	city: z.string().min(1, "City is required").max(100).trim(),
	state: z.string().max(100).trim().optional(),
	postalCode: z.string().max(20).trim().optional(),
	country: z.string().max(2).toUpperCase().optional(),
	isDefault: z.boolean().optional(),
	lat: z.number().optional(),
	lng: z.number().optional(),
});

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
		.array(storefrontAddressSchema)
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
