import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";
import { organizationInfo } from "@/lib/db/schema";
export const insertOrganizationInfoSchema = createInsertSchema(
	organizationInfo,
	{
		contactName: z.string().max(100).optional().or(z.literal("")),
		contactEmail: z.email().max(100).optional().or(z.literal("")),
		contactPhone: z.string().max(20).optional().or(z.literal("")),
		travelFeeType: z
			.enum(["fixed", "per_km", "varies", "start_at", "free"])
			.optional(),
		travelFeeValue: z
			.string()
			.regex(/^\d+(\.\d{1,2})?$/, "Must be a valid decimal number")
			.optional(),
		travelFeeValueByKm: z
			.string()
			.regex(/^\d+(\.\d{1,2})?$/, "Must be a valid decimal number")
			.optional(),
		maxTravelDistance: z.number().int().optional(),
		travelFeesPolicyText: z.string().optional().or(z.literal("")),
		minimumTravelFees: z
			.string()
			.regex(/^\d+(\.\d{1,2})?$/, "Must be a valid decimal number")
			.optional(),
		taxRate: z
			.string()
			.regex(/^\d+(\.\d{1,2})?$/, "Tax rate must be a valid monetary value")
			.optional(),
		defaultLanguage: z.string().optional(),
		currency: z.string().optional(),
		activeLanguages: z.array(z.string()).optional(),
		images: z
			.array(
				z.object({
					url: z.string(),
					alt: z.string().optional(),
					type: z.string().optional(),
					itemType: z.string().optional(),
					key: z.string().optional(),
					name: z.string().optional(),
					size: z.number().optional(),
				}),
			)
			.optional(),
		socialLinks: z
			.object({
				facebook: z.string().optional(),
				instagram: z.string().optional(),
				twitter: z.string().optional(),
				linkedin: z.string().optional(),
				tiktok: z.string().optional(),
				youtube: z.string().optional(),
				telegram: z.string().optional(),
				website: z.string().optional(),
			})
			.optional(),
	},
);

export const updateOrganizationInfoSchema = createSelectSchema(
	organizationInfo,
	{
		contactName: z.string().max(100).optional().or(z.literal("")),
		contactEmail: z.email().max(100).optional().or(z.literal("")),
		contactPhone: z.string().max(20).optional().or(z.literal("")),
		travelFeeType: z
			.enum(["fixed", "per_km", "varies", "start_at", "free"])
			.optional(),
		travelFeeValue: z
			.string()
			.regex(/^\d+(\.\d{1,2})?$/, "Must be a valid decimal number")
			.optional(),
		travelFeeValueByKm: z
			.string()
			.regex(/^\d+(\.\d{1,2})?$/, "Must be a valid decimal number")
			.optional(),
		maxTravelDistance: z.number().int().optional(),
		travelFeesPolicyText: z.string().optional().or(z.literal("")),
		minimumTravelFees: z
			.string()
			.regex(/^\d+(\.\d{1,2})?$/, "Must be a valid decimal number")
			.optional(),
		taxRate: z
			.string()
			.regex(/^\d+(\.\d{1,2})?$/, "Tax rate must be a valid monetary value")
			.optional(),
		currency: z.string().optional(),
		activeLanguages: z.array(z.string()).optional(),
		images: z
			.array(
				z.object({
					url: z.string(),
					alt: z.string().optional(),
					type: z.string().optional(),
					itemType: z.string().optional(),
					key: z.string().optional(),
					name: z.string().optional(),
					size: z.number().optional(),
				}),
			)
			.optional(),
		socialLinks: z
			.object({
				facebook: z.string().optional(),
				instagram: z.string().optional(),
				twitter: z.string().optional(),
				linkedin: z.string().optional(),
				tiktok: z.string().optional(),
				youtube: z.string().optional(),
				telegram: z.string().optional(),
				website: z.string().optional(),
			})
			.optional(),
	},
).partial();
