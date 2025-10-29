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
import { softAudit } from "../helpers/common";
import type {
	TAddress,
	TOrderStatus,
	TPaymentStatus,
	TStockMovementType,
} from "../helpers/types";
import { organization } from "../organization";
import { user } from "../user";
import { location } from "./location";
import { productVariant } from "./product";

// Immutable movement ledger (auditable writes)
export const stockMovement = pgTable("stock_movement", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),

	productVariantId: uuid("product_variant_id")
		.notNull()
		.references(() => productVariant.id, { onDelete: "cascade" }),

	type: varchar("type", { length: 255 }).notNull().$type<TStockMovementType>(),
	quantity: integer("quantity").notNull(), // +in, -out
	previousStock: integer("previous_stock").notNull(),
	newStock: integer("new_stock").notNull(),
	unitCost: numeric("unit_cost", { precision: 12, scale: 2 }),
	reference: varchar("reference", { length: 100 }), // Order ID, PO, etc.
	reason: varchar("reason", { length: 255 }),
	notes: text("notes"),
	...softAudit,
});

/**
 * ---------------------------------------------------------------------------
 * ORDERS, ITEMS, STATUS HISTORY, REVIEWS
 * ---------------------------------------------------------------------------
 */
export const order = pgTable("order", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	userId: text("user_id").references(() => user.id, { onDelete: "set null" }),

	orderNumber: varchar("order_number", { length: 50 }).notNull(),
	status: text("status").default("pending").notNull(),

	// Currency-aware totals
	currency: varchar("currency", { length: 3 }).notNull(), // ISO 4217
	subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
	taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0"),
	shippingAmount: numeric("shipping_amount", {
		precision: 12,
		scale: 2,
	}).default("0"),
	discountAmount: numeric("discount_amount", {
		precision: 12,
		scale: 2,
	}).default("0"),
	totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),

	// Customer snapshot
	customerFullName: varchar("customer_full_name", { length: 255 }),
	customerEmail: varchar("customer_email", { length: 255 }),
	customerPhone: varchar("customer_phone", { length: 50 }),
	customerNotes: text("customer_notes"),

	shippingAddress: jsonb("shipping_address").notNull().$type<TAddress>(),
	billingAddress: jsonb("billing_address").$type<TAddress>(),

	paymentMethod: varchar("payment_method", { length: 50 }),
	paymentStatus: text("payment_status")
		.default("pending")
		.$type<TPaymentStatus>(),
	shippingMethod: varchar("shipping_method", { length: 100 }),
	trackingNumber: varchar("tracking_number", { length: 100 }),

	orderDate: timestamp("order_date").defaultNow().notNull(),
	expectedShipDate: timestamp("expected_ship_date"),
	shippedAt: timestamp("shipped_at"),
	deliveredAt: timestamp("delivered_at"),
	cancelledAt: timestamp("cancelled_at"),

	notes: text("notes"),
	tags: jsonb("tags"), // ["rush", "vip", "wholesale"]
	metadata: jsonb("metadata"),

	...softAudit,
});

export const orderItem = pgTable("order_item", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	orderId: uuid("order_id")
		.notNull()
		.references(() => order.id, { onDelete: "cascade" }),
	productVariantId: uuid("product_variant_id")
		.notNull()
		.references(() => productVariant.id, { onDelete: "restrict" }),
	locationId: uuid("location_id") // Add locationId to orderItem schema
		.notNull()
		.references(() => location.id),

	// Snapshot fields
	productName: varchar("product_name", { length: 255 }).notNull(),
	variantName: varchar("variant_name", { length: 255 }),
	sku: varchar("sku", { length: 100 }).notNull(),

	quantity: integer("quantity").notNull(),
	unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
	unitCost: numeric("unit_cost", { precision: 12, scale: 2 }),
	totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),

	quantityShipped: integer("quantity_shipped").default(0),
	quantityReturned: integer("quantity_returned").default(0),

	...softAudit,
});

export const orderStatusHistory = pgTable("order_status_history", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	orderId: uuid("order_id")
		.notNull()
		.references(() => order.id, { onDelete: "cascade" }),
	status: text("status").notNull().$type<TOrderStatus>(),
	previousStatus: text("previous_status").$type<TOrderStatus>(),
	notes: text("notes"),
	metadata: jsonb("metadata"),
	...softAudit,
});
