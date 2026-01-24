import { sql } from "drizzle-orm";
import {
	boolean,
	jsonb,
	numeric,
	pgTable,
	text,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { softAudit } from "../helpers/common";
import { organization } from "../organization";

/**
 * ---------------------------------------------------------------------------
 * SHIPPING ZONES
 * ---------------------------------------------------------------------------
 */
export const shippingZone = pgTable("shipping_zone", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),

	name: varchar("name", { length: 255 }).notNull(),
	code: varchar("code", { length: 50 }).notNull(),
	description: text("description"),

	// Geographic coverage
	countries: jsonb("countries").$type<string[]>(), // ISO country codes: ["US", "CA", "MX"]
	states: jsonb("states").$type<string[]>(), // State/province codes
	cities: jsonb("cities").$type<string[]>(), // Specific cities
	postalCodes: jsonb("postal_codes").$type<string[]>(), // Postal/ZIP codes or patterns

	// Status
	isActive: boolean("is_active").default(true).notNull(),

	// Additional configuration
	metadata: jsonb("metadata"),

	...softAudit,
});

/**
 * ---------------------------------------------------------------------------
 * SHIPPING METHODS
 * ---------------------------------------------------------------------------
 */
export const shippingMethod = pgTable("shipping_method", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),

	name: varchar("name", { length: 255 }).notNull(),
	code: varchar("code", { length: 50 }).notNull(),
	description: text("description"),

	// Pricing
	basePrice: numeric("base_price", { precision: 12, scale: 2 })
		.notNull()
		.default("0"),
	currency: varchar("currency", { length: 3 }).notNull().default("USD"), // ISO 4217

	// Conditions
	minOrderAmount: numeric("min_order_amount", { precision: 12, scale: 2 }),
	maxOrderAmount: numeric("max_order_amount", { precision: 12, scale: 2 }),
	freeShippingThreshold: numeric("free_shipping_threshold", {
		precision: 12,
		scale: 2,
	}),

	// Delivery time
	estimatedMinDays: varchar("estimated_min_days", { length: 50 }),
	estimatedMaxDays: varchar("estimated_max_days", { length: 50 }),

	// Carrier information
	carrier: varchar("carrier", { length: 100 }), // e.g., "UPS", "FedEx", "USPS"
	trackingUrl: varchar("tracking_url", { length: 500 }), // URL template for tracking

	// Status and availability
	isActive: boolean("is_active").default(true).notNull(),
	isDefault: boolean("is_default").default(false).notNull(),

	// Additional configuration
	metadata: jsonb("metadata"), // For custom fields, etc.

	...softAudit,
});

/**
 * ---------------------------------------------------------------------------
 * SHIPPING METHOD ZONES (Junction Table)
 * ---------------------------------------------------------------------------
 */
export const shippingMethodZone = pgTable("shipping_method_zone", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),

	shippingMethodId: uuid("shipping_method_id")
		.notNull()
		.references(() => shippingMethod.id, { onDelete: "cascade" }),

	shippingZoneId: uuid("shipping_zone_id")
		.notNull()
		.references(() => shippingZone.id, { onDelete: "cascade" }),

	// Zone-specific pricing override
	priceOverride: numeric("price_override", { precision: 12, scale: 2 }),

	// Zone-specific delivery time override
	estimatedMinDaysOverride: varchar("estimated_min_days_override", {
		length: 50,
	}),
	estimatedMaxDaysOverride: varchar("estimated_max_days_override", {
		length: 50,
	}),

	// Status
	isActive: boolean("is_active").default(true).notNull(),

	...softAudit,
});
