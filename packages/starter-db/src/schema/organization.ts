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
		.references(() => organization.id, { onDelete: "cascade" })
		.unique(),
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
	bonusPercentage: numeric("bonus_percentage", { precision: 5, scale: 2 })
		.default("0")
		.notNull(),
	defaultLanguage: varchar("default_language", { length: 20 }),
	activeLanguages: jsonb("active_languages").$type<string[]>(),
	images: jsonb("images").$type<TImage[]>(),

	socialLinks: jsonb("social_links").$type<TSocialLinks>(),
});
