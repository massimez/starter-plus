import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { idAndAuditFields } from "@/helpers/constant/fields";
import { client } from "@/lib/db/schema/store/client";
import {
	addressSchema,
	emailSchema,
	externalIdsSchema,
	fraudScoreSchema,
	languageSchema,
	metadataSchema,
	notesSchema,
	phoneSchema,
	tagsArraySchema,
	timezoneSchema,
} from "./validation";

// Protected fields that should not be directly settable by users
const protectedFields = {
	// Verification status - should only be set by verification process
	emailVerified: true,
	phoneVerified: true,

	// Security fields - admin only
	isBlacklisted: true,
	fraudScore: true,

	// Computed fields - set by system
	totalOrders: true,
	totalUncompletedOrders: true,
	totalSpent: true,
	firstPurchaseDate: true,
	lastPurchaseDate: true,

	// Privacy fields - set by system
	dataAnonymizedAt: true,

	// User link - handled by separate endpoints
	userId: true,
} as const;

// Base schema with all validations
const baseClientSchema = createInsertSchema(client, {
	email: emailSchema.optional(),
	phone: phoneSchema.optional(),
	firstName: z.string().min(1).max(100).trim().optional(),
	lastName: z.string().min(1).max(100).trim().optional(),
	addresses: z.array(addressSchema).max(10).optional(),
	preferredContactMethod: z.enum(["email", "phone", "sms"]).optional(),
	language: languageSchema.optional(),
	timezone: timezoneSchema.optional(),
	source: z.enum(["manual", "purchase", "import", "login"]).optional(),
	tags: tagsArraySchema.optional(),
	notes: notesSchema.optional(),
	marketingConsent: z.boolean().optional(),
	marketingConsentDate: z.coerce.date().optional(),
	gdprConsent: z.boolean().optional(),
	gdprConsentDate: z.coerce.date().optional(),
	externalIds: externalIdsSchema.optional(),
	metadata: metadataSchema.optional(),
	isActive: z.boolean().optional(),
}).omit(idAndAuditFields);

// Regular user insert schema - excludes protected fields
export const insertClientSchema = baseClientSchema.omit(protectedFields);

// Regular user update schema - excludes protected fields
export const updateClientSchema = createSelectSchema(client, {
	email: emailSchema.optional(),
	phone: phoneSchema.optional(),
	firstName: z.string().min(1).max(100).trim().optional(),
	lastName: z.string().min(1).max(100).trim().optional(),
	addresses: z.array(addressSchema).max(10).optional(),
	preferredContactMethod: z.enum(["email", "phone", "sms"]).optional(),
	language: languageSchema.optional(),
	timezone: timezoneSchema.optional(),
	source: z.enum(["manual", "purchase", "import", "login"]).optional(),
	tags: tagsArraySchema.optional(),
	notes: notesSchema.optional(),
	marketingConsent: z.boolean().optional(),
	marketingConsentDate: z.coerce.date().optional(),
	gdprConsent: z.boolean().optional(),
	gdprConsentDate: z.coerce.date().optional(),
	externalIds: externalIdsSchema.optional(),
	metadata: metadataSchema.optional(),
	isActive: z.boolean().optional(),
})
	.omit({ ...idAndAuditFields, ...protectedFields })
	.partial();

// Admin-only schema for updating protected fields
export const adminUpdateClientSchema = createSelectSchema(client, {
	email: emailSchema.optional(),
	phone: phoneSchema.optional(),
	emailVerified: z.boolean().optional(),
	phoneVerified: z.boolean().optional(),
	isBlacklisted: z.boolean().optional(),
	fraudScore: fraudScoreSchema.optional(),
	firstName: z.string().min(1).max(100).trim().optional(),
	lastName: z.string().min(1).max(100).trim().optional(),
	addresses: z.array(addressSchema).max(10).optional(),
	preferredContactMethod: z.enum(["email", "phone", "sms"]).optional(),
	language: languageSchema.optional(),
	timezone: timezoneSchema.optional(),
	source: z.enum(["manual", "purchase", "import", "login"]).optional(),
	tags: tagsArraySchema.optional(),
	notes: notesSchema.optional(),
	marketingConsent: z.boolean().optional(),
	marketingConsentDate: z.coerce.date().optional(),
	gdprConsent: z.boolean().optional(),
	gdprConsentDate: z.coerce.date().optional(),
	externalIds: externalIdsSchema.optional(),
	metadata: metadataSchema.optional(),
	isActive: z.boolean().optional(),
})
	.omit({
		...idAndAuditFields,
		// Still exclude computed fields even for admin
		totalOrders: true,
		totalUncompletedOrders: true,
		totalSpent: true,
		firstPurchaseDate: true,
		lastPurchaseDate: true,
		dataAnonymizedAt: true,
		userId: true,
	})
	.partial();

// Type exports
export type InsertClient = z.infer<typeof insertClientSchema>;
export type UpdateClient = z.infer<typeof updateClientSchema>;
export type AdminUpdateClient = z.infer<typeof adminUpdateClientSchema>;
