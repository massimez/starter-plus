import { sql } from "drizzle-orm";
import {
	boolean,
	decimal,
	integer,
	jsonb,
	pgTable,
	text,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { softAudit } from "../helpers/common";
import type { TAddress } from "../helpers/types";
import { organization } from "../organization";

/**
 * ---------------------------------------------------------------------------
 * SUPPLIERS
 * ---------------------------------------------------------------------------
 */
export const supplier = pgTable("supplier", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),

	name: varchar("name", { length: 255 }).notNull(),
	code: varchar("code", { length: 50 }),
	email: varchar("email", { length: 255 }),
	phone: varchar("phone", { length: 50 }),
	website: varchar("website", { length: 255 }),
	contactPerson: varchar("contact_person", { length: 255 }),
	address: jsonb("address").$type<TAddress>(),
	city: varchar("city", { length: 100 }),
	country: varchar("country", { length: 100 }),
	paymentTerms: varchar("payment_terms", { length: 100 }),
	leadTimeDays: integer("lead_time_days"),
	currency: varchar("currency", { length: 3 }).default("USD"), // Default supplier currency
	rating: decimal("rating", { precision: 3, scale: 2 }),
	isActive: boolean("is_active").default(true).notNull(),
	metadata: jsonb("metadata"),
	...softAudit,
});

export const brand = pgTable("brand", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),

	name: varchar("name", { length: 255 }).notNull(),
	slug: varchar("slug", { length: 255 }).notNull(),
	logo: text("logo"),
	website: varchar("website", { length: 255 }),
	description: text("description"),
	isActive: boolean("is_active").default(true).notNull(),
	metadata: jsonb("metadata"),

	...softAudit,
});
