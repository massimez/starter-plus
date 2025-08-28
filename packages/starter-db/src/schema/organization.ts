import { sql } from "drizzle-orm";
import {
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import type { TImage, TSocialLinks } from "./helpers/types";
import { user } from "./user";

export const organization = pgTable("organization", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	slug: text("slug").unique(),
	logo: text("logo"),
	metadata: text("metadata"),
	createdAt: timestamp("created_at").notNull(),
});

export const member = pgTable("member", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	role: text("role").default("member").notNull(),
	createdAt: timestamp("created_at").notNull(),
});

export const invitation = pgTable("invitation", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	email: text("email").notNull(),
	role: text("role"),
	status: text("status").default("pending").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	inviterId: text("inviter_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const organizationInfo = pgTable("organization_info", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	// Contact Info
	contactName: varchar("contact_name", { length: 100 }),
	contactEmail: varchar("contact_email", { length: 100 }),
	contactPhone: varchar("contact_phone", { length: 20 }),

	// Travel Fees
	travelFeeType: varchar("travel_fee_type", {
		length: 50,
	}).$type<"fixed" | "per_km" | "varies" | "start_at" | "free">(),
	travelFeeValue: integer("travel_fee_value"),
	travelFeeValueByKm: integer("travel_fee_value_by_km"),

	maxTravelDistance: integer("max_travel_distance"),

	// Travel Fees Policy Text
	travelFeesPolicyText: text("travel_fees_policy_text"),
	minimumTravelFees: integer("minimum_travel_fees"),
	taxRate: numeric("tax_rate", { precision: 5, scale: 2 })
		.default("0.00")
		.notNull(),
	defaultLanguage: text("default_language"),
	activeLanguages: text("active_languages"),
	images: jsonb("images").$type<TImage[]>(),

	socialLinks: jsonb("social_links").$type<TSocialLinks>(),
});

export const insertOrganizationInfoSchema = createInsertSchema(
	organizationInfo,
	{
		organizationId: z.string().min(1),
		contactName: z.string().max(100).optional().or(z.literal("")),
		contactEmail: z.email().max(100).optional().or(z.literal("")),
		contactPhone: z.string().max(20).optional().or(z.literal("")),
		travelFeeType: z
			.enum(["fixed", "per_km", "varies", "start_at", "free"])
			.optional(),
		travelFeeValue: z.number().int().optional(),
		travelFeeValueByKm: z.number().int().optional(),
		maxTravelDistance: z.number().int().optional(),
		travelFeesPolicyText: z.string().optional().or(z.literal("")),
		minimumTravelFees: z.number().int().optional(),
		taxRate: z
			.string()
			.regex(/^\d+(\.\d{1,2})?$/, "Tax rate must be a valid monetary value")
			.optional(),
		defaultLanguage: z.string().optional(),
		activeLanguages: z.string().optional(),
		images: z
			.array(
				z.object({
					url: z.string(),
					alt: z.string().optional(),
					type: z.string().optional(),
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
		travelFeeValue: z.number().int().optional(),
		travelFeeValueByKm: z.number().int().optional(),
		maxTravelDistance: z.number().int().optional(),
		travelFeesPolicyText: z.string().optional().or(z.literal("")),
		minimumTravelFees: z.number().int().optional(),
		taxRate: z
			.string()
			.regex(/^\d+(\.\d{1,2})?$/, "Tax rate must be a valid monetary value")
			.optional(),
		defaultLanguage: z.number().int().optional(),
		activeLanguages: z.string().optional().or(z.literal("")),
		images: z
			.array(
				z.object({
					url: z.string(),
					alt: z.string().optional(),
					type: z.string().optional(),
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
