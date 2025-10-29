import { pgEnum, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "../user";

/**
 * ---------------------------------------------------------------------------
 * COMMONS / HELPERS
 * ---------------------------------------------------------------------------
 */
// Soft-delete & audit trail mixin (spread into tables)
export const softAudit = {
	createdAt: timestamp("created_at", { withTimezone: false })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date()),
	deletedAt: timestamp("deleted_at", { withTimezone: false }),
	createdBy: text("created_by").references(() => user.id, {
		onDelete: "set null",
	}),
	updatedBy: text("updated_by").references(() => user.id, {
		onDelete: "set null",
	}),
};

export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
	"purchase", // Inventory received from supplier
	"sale", // Sold to customer
	"adjustment", // Manual stock correction
	"return", // Customer return (adds back)
	"return_to_supplier", // Return to supplier (removes)
	"damaged", // Damaged goods writeoff
	"expired", // Expired goods writeoff
	"theft", // Shrinkage/theft
	"transfer_in", // Transfer from another location
	"transfer_out", // Transfer to another location
	"assembly", // Used in product assembly
	"disassembly", // From product disassembly
	"promotion", // Promotional giveaway
	"sample", // Product samples
	"manufacturing", // Used in manufacturing
	"cycle_count", // Cycle count adjustment
	"lost", // Lost inventory
	"found", // Found inventory
	"reservation", // Reserved for order
	"unreservation", // Released reservation
]);

// // Reservation status
// export const reservationStatusEnum = pgEnum("reservation_status", [
// 	"active", // Currently reserved
// 	"expired", // Reservation expired
// 	"released", // Manually released
// 	"consumed", // Used in order fulfillment
// 	"cancelled", // Cancelled reservation
// ]);

// export const discountTypeEnum = pgEnum("discount_type", [
// 	"percentage", // 10% off
// 	"fixed_amount", // $10 off
// 	"free_shipping", // Free shipping
// 	"buy_x_get_y", // Buy 2 get 1 free
// 	"bulk_discount", // Quantity-based discount
// ]);
