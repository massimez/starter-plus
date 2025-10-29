import { sql } from "drizzle-orm";
import {
	boolean,
	integer,
	jsonb,
	pgTable,
	text,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { softAudit } from "../helpers/common";
import { organization } from "../organization";

/**
 * ---------------------------------------------------------------------------
 * ADDRESSES - Shared address storage
 * ---------------------------------------------------------------------------
 */
export const address = pgTable("address", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	street: varchar("street", { length: 255 }),
	city: varchar("city", { length: 100 }),
	state: varchar("state", { length: 100 }),
	zipCode: varchar("zip_code", { length: 20 }),
	country: varchar("country", { length: 100 }),
	office: varchar("office", { length: 255 }),
	building: varchar("building", { length: 255 }),
	latitude: varchar("latitude", { length: 20 }),
	longitude: varchar("longitude", { length: 20 }),
	...softAudit,
});

/**
 * ---------------------------------------------------------------------------
 * LOCATIONS (Warehouses, Shops, etc.)
 * ---------------------------------------------------------------------------
 */
export const location = pgTable("location", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),

	locationType: varchar("location_type", {
		length: 50,
	})
		.notNull()
		.$type<"warehouse" | "shop" | "distribution_center">(),

	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),

	addressId: uuid("address_id").references(() => address.id),

	// Capacity (e.g., units, pallets, etc.)
	capacity: integer("capacity"),

	contactName: varchar("contact_name", { length: 100 }),
	contactEmail: varchar("contact_email", { length: 100 }),
	contactPhone: varchar("contact_phone", { length: 20 }),

	isActive: boolean("is_active").default(true).notNull(),
	isDefault: boolean("is_default").default(false).notNull(),

	metadata: jsonb("metadata").$type<Record<string, unknown>>(),

	...softAudit,
});

// Zod Schemas for validation
const addressSchema = z.object({
	street: z.string().max(255).optional(),
	city: z.string().max(100).optional(),
	state: z.string().max(100).optional(),
	zipCode: z.string().max(20).optional(),
	country: z.string().max(100).optional(),
	office: z.string().max(255).optional(),
	building: z.string().max(255).optional(),
	latitude: z.string().max(20).optional(),
	longitude: z.string().max(20).optional(),
});

export const insertAddressSchema = addressSchema;
export const updateAddressSchema = addressSchema.partial();
