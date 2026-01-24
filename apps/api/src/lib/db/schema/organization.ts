import { sql } from "drizzle-orm";
import {
	index,
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

export const member = pgTable(
	"member",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		role: text("role").default("member").notNull(),
		createdAt: timestamp("created_at").notNull(),
	},
	(table) => [
		index("member_organizationId_idx").on(table.organizationId),
		index("member_userId_idx").on(table.userId),
	],
);

export const invitation = pgTable(
	"invitation",
	{
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
	},
	(table) => [
		index("invitation_organizationId_idx").on(table.organizationId),
		index("invitation_email_idx").on(table.email),
	],
);

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
	travelFeeValue: numeric("travel_fee_value", { precision: 12, scale: 2 }),
	travelFeeValueByKm: numeric("travel_fee_value_by_km", {
		precision: 12,
		scale: 2,
	}),

	maxTravelDistance: integer("max_travel_distance"),

	// Travel Fees Policy Text
	travelFeesPolicyText: text("travel_fees_policy_text"),
	minimumTravelFees: numeric("minimum_travel_fees", {
		precision: 12,
		scale: 2,
	}),
	taxRate: numeric("tax_rate", { precision: 5, scale: 2 })
		.default("0.00")
		.notNull(),
	defaultLanguage: varchar("default_language", { length: 20 }),
	currency: varchar("currency", { length: 10 }).default("USD").notNull(),
	activeLanguages: jsonb("active_languages").$type<string[]>(),
	images: jsonb("images").$type<TImage[]>(),

	socialLinks: jsonb("social_links").$type<TSocialLinks>(),
});
