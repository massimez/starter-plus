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
import type { TAddress } from "../helpers/types";
import { organization } from "../organization";

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

	address: jsonb("address").$type<TAddress>(),

	latitude: varchar("latitude", { length: 20 }),
	longitude: varchar("longitude", { length: 20 }),

	// Capacity (e.g., units, pallets, etc.)
	capacity: integer("capacity"),

	isActive: boolean("is_active").default(true).notNull(),
	isDefault: boolean("is_default").default(false).notNull(),

	metadata: jsonb("metadata").$type<Record<string, unknown>>(),

	...softAudit,
});

// Zod Schemas for validation
const TAddressSchema = z.object({
	street: z.string().max(255).optional(),
	city: z.string().max(100).optional(),
	state: z.string().max(100).optional(),
	zipCode: z.string().max(20).optional(),
	country: z.string().max(100).optional(),
	office: z.string().max(255).optional(),
	building: z.string().max(255).optional(),
});

export const insertLocationSchema = z.object({
	organizationId: z.string().min(1).max(255),
	locationType: z.enum(["warehouse", "shop", "distribution_center"]),
	name: z.string().min(1).max(255),
	description: z.string().optional(),
	address: TAddressSchema.optional(),
	latitude: z.string().max(20).optional(),
	longitude: z.string().max(20).optional(),
	capacity: z.number().int().positive().optional(),
	contactName: z.string().max(100).optional(),
	contactEmail: z.email().max(100).optional(),
	contactPhone: z.string().max(20).optional(),

	isActive: z.boolean().default(true).optional(),
	isDefault: z.boolean().default(false).optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateLocationSchema = insertLocationSchema.partial().extend({
	organizationId: z.string().min(1).max(255),
});

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type UpdateLocation = z.infer<typeof updateLocationSchema>;
