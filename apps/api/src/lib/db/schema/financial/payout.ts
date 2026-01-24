import { sql } from "drizzle-orm";
import {
	decimal,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { softAudit } from "../helpers/common";
import { organization } from "../organization";
import { bonusTransaction } from "../store/bonus";
import { user } from "../user";

/**
 * ---------------------------------------------------------------------------
 * PAYOUT REQUESTS
 * ---------------------------------------------------------------------------
 */
export const payoutRequest = pgTable("payout_request", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),

	// Amount requested
	cashAmount: decimal("cash_amount", { precision: 12, scale: 2 }).notNull(),
	pointsDeducted: integer("points_deducted").notNull(),

	status: text("status")
		.default("pending")
		.notNull()
		.$type<"pending" | "approved" | "rejected" | "paid">(),

	payoutMethod: jsonb("payout_method")
		.$type<{
			type: "paypal" | "bank_transfer";
			details: Record<string, string>;
		}>()
		.notNull(),

	bonusTransactionId: uuid("bonus_transaction_id")
		.notNull()
		.references(() => bonusTransaction.id, { onDelete: "cascade" }),

	processedAt: timestamp("processed_at"),
	processedBy: text("processed_by"), // Admin user ID
	rejectionReason: text("rejection_reason"),

	...softAudit,
});
