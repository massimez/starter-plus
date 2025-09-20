import { sql } from "drizzle-orm";
import {
	boolean,
	decimal,
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { softAudit } from "../helpers/common";
import type { TAddress } from "../helpers/types";
import { organization } from "../organization";
import { productVariant } from "./product";

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
	currency: varchar("currency", { length: 3 }),
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

export const productSupplier = pgTable("product_supplier", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),

	productVariantId: uuid("product_variant_id")
		.notNull()
		.references(() => productVariant.id, { onDelete: "cascade" }),

	supplierId: uuid("supplier_id")
		.notNull()
		.references(() => supplier.id, { onDelete: "cascade" }),

	supplierSku: varchar("supplier_sku", { length: 100 }),
	unitCost: numeric("unit_cost", { precision: 12, scale: 2 }).notNull(),
	minOrderQuantity: integer("min_order_quantity").default(1).notNull(),
	leadTimeDays: integer("lead_time_days"),
	isPreferred: boolean("is_preferred").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	...softAudit,
});
