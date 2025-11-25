import { sql } from "drizzle-orm";
import {
	boolean,
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { softAudit } from "../helpers/common";
import type { TAddress } from "../helpers/types";
import { organization } from "../organization";
import { user } from "../user";

export const client = pgTable("client", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),

	// Link to user account (optional - clients can exist without users)
	userId: text("user_id").references(() => user.id, { onDelete: "set null" }),

	// Basic contact information (syncs with user account when linked)
	firstName: varchar("first_name", { length: 100 }),
	lastName: varchar("last_name", { length: 100 }),
	email: varchar("email", { length: 255 }),
	emailVerified: boolean("email_verified").default(false),
	phone: varchar("phone", { length: 50 }),
	phoneVerified: boolean("phone_verified").default(false),

	// Addresses - array of addresses with types ("billing", "shipping")
	addresses:
		jsonb("addresses").$type<
			Array<TAddress & { type: "billing" | "shipping" }>
		>(),

	// Purchase history summary (computed fields)
	totalOrders: integer("total_orders").default(0),
	totalUncompletedOrders: integer("total_uncompleted_orders").default(0),
	totalSpent: numeric("total_spent", { precision: 12, scale: 2 }).default("0"),
	firstPurchaseDate: timestamp("first_purchase_date"),
	lastPurchaseDate: timestamp("last_purchase_date"),

	// Communication preferences
	preferredContactMethod: varchar("preferred_contact_method", { length: 20 }), // "email", "phone", "sms"
	language: varchar("language", { length: 10 }).default("en"), // ISO 639-1
	timezone: varchar("timezone", { length: 50 }).default("UTC"),

	// Client management
	source: varchar("source", { length: 50 }), // "manual", "purchase", "import"
	tags: jsonb("tags"), // ["vip", "wholesale", "loyal"]
	notes: text("notes"),
	marketingConsent: boolean("marketing_consent").default(false),
	marketingConsentDate: timestamp("marketing_consent_date"),
	gdprConsent: boolean("gdpr_consent").default(false),
	gdprConsentDate: timestamp("gdpr_consent_date"),

	// Risk management
	isBlacklisted: boolean("is_blacklisted").default(false),
	fraudScore: numeric("fraud_score", { precision: 5, scale: 2 }).default("0"), // 0-100 scale

	// External integrations
	externalIds: jsonb("external_ids"), // {"crm": "123", "mailchimp": "456"}

	// Privacy
	dataAnonymizedAt: timestamp("data_anonymized_at"),

	// Status
	isActive: boolean("is_active").default(true),

	// Additional metadata
	metadata: jsonb("metadata"),

	...softAudit,
});
