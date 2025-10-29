import { sql } from "drizzle-orm";
import {
	decimal,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { softAudit } from "../helpers/common";
import { organization } from "../organization";
import { location } from "./location";
import { productVariant } from "./product";
import { supplier } from "./supplier";

/**
 * ---------------------------------------------------------------------------
 * INVENTORY TABLES (Moved from product.ts)
 * ---------------------------------------------------------------------------
 */

export const productVariantBatch = pgTable("product_variant_batch", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	productVariantId: uuid("product_variant_id")
		.notNull()
		.references(() => productVariant.id),
	organizationId: text("organization_id").notNull(),

	batchNumber: varchar("batch_number", { length: 100 }).notNull(),
	expiryDate: timestamp("expiry_date"),
	locationId: uuid("location_id").notNull(),
	quantity: integer("quantity").default(0).notNull(),
	...softAudit,
});

// ─────────────────────────────
// Stock Transactions (Ledger)
// ─────────────────────────────
export const productVariantStockTransaction = pgTable(
	"product_variant_stock_transaction",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		productVariantId: uuid("product_variant_id")
			.notNull()
			.references(() => productVariant.id),
		organizationId: text("organization_id").notNull(),
		locationId: uuid("location_id").notNull(),
		supplierId: uuid("supplier_id").references(() => supplier.id),

		batchId: uuid("batch_id").references(() => productVariantBatch.id),
		quantityChange: integer("quantity_change").notNull(),
		unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
		reason: varchar("reason", { length: 50 }).notNull(), // purchase, sale, return, adjustment, transfer_in, transfer_out
		referenceId: uuid("reference_id"), // e.g. orderId, purchaseOrderId
		transferGroupId: uuid("transfer_group_id"), // link IN & OUT for transfers
		...softAudit,
	},
);

// Current stock snapshot (fast reads)
export const productVariantStock = pgTable(
	"product_variant_stock",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		productVariantId: uuid("product_variant_id")
			.notNull()
			.references(() => productVariant.id, { onDelete: "cascade" }),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		locationId: uuid("location_id")
			.notNull()
			.references(() => location.id),
		quantity: integer("quantity").default(0).notNull(),
		reservedQuantity: integer("reserved_quantity").default(0),
		unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
		currency: varchar("currency", { length: 3 }).default("USD"),
		...softAudit,
	},
	(t) => [
		uniqueIndex("uq_variant_org_loc").on(
			t.productVariantId,
			t.organizationId,
			t.locationId,
		),
	],
);
