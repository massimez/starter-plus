import { sql } from "drizzle-orm";
import {
	index,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { softAudit } from "../helpers/common";
import { organization } from "../organization";
import { client } from "../store/client";
import { glAccount } from "./accounts";

/**
 * ---------------------------------------------------------------------------
 * ACCOUNTS RECEIVABLE (AR) - Uses existing client table
 * ---------------------------------------------------------------------------
 */

/**
 * Customer Invoices
 * Invoices sent to customers
 */
export const customerInvoice = pgTable(
	"customer_invoice",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		customerId: uuid("customer_id")
			.notNull()
			.references(() => client.id, { onDelete: "restrict" }),

		// Invoice details
		invoiceNumber: varchar("invoice_number", { length: 100 }).notNull(),
		invoiceDate: timestamp("invoice_date", { withTimezone: false }).notNull(),
		dueDate: timestamp("due_date", { withTimezone: false }).notNull(),

		// Amounts
		currency: varchar("currency", { length: 3 }).notNull(), // ISO 4217
		exchangeRate: numeric("exchange_rate", { precision: 12, scale: 6 }).default(
			"1",
		),
		totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
		taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0"),
		discountAmount: numeric("discount_amount", {
			precision: 12,
			scale: 2,
		}).default("0"),
		netAmount: numeric("net_amount", { precision: 12, scale: 2 }).notNull(),

		// Status
		status: varchar("status", { length: 20 })
			.default("draft")
			.notNull()
			.$type<
				"draft" | "sent" | "partially_paid" | "paid" | "overdue" | "cancelled"
			>(),
		paymentStatus: varchar("payment_status", { length: 20 })
			.default("unpaid")
			.$type<"unpaid" | "partially_paid" | "paid">(),

		// Tracking
		sentAt: timestamp("sent_at", { withTimezone: false }),

		// Notes
		notes: text("notes"),

		...softAudit,
	},
	(table) => [
		index("customer_invoice_org_idx").on(table.organizationId),
		index("customer_invoice_customer_idx").on(table.customerId),
		index("customer_invoice_number_idx").on(
			table.organizationId,
			table.invoiceNumber,
		),
		index("customer_invoice_status_idx").on(table.status),
		index("customer_invoice_due_date_idx").on(table.dueDate),
	],
);

/**
 * Customer Invoice Lines
 * Line items for customer invoices
 */
export const customerInvoiceLine = pgTable(
	"customer_invoice_line",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		customerInvoiceId: uuid("customer_invoice_id")
			.notNull()
			.references(() => customerInvoice.id, { onDelete: "cascade" }),
		revenueAccountId: uuid("revenue_account_id")
			.notNull()
			.references(() => glAccount.id, { onDelete: "restrict" }),

		description: text("description").notNull(),
		quantity: numeric("quantity", { precision: 12, scale: 4 }).default("1"),
		unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
		taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),
		taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0"),
		totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),

		// Optional dimensional tracking
		costCenterId: uuid("cost_center_id"),

		...softAudit,
	},
	(table) => [
		index("customer_invoice_line_invoice_idx").on(table.customerInvoiceId),
		index("customer_invoice_line_account_idx").on(table.revenueAccountId),
	],
);

/**
 * Customer Payments
 * Payments received from customers
 */
export const customerPayment = pgTable(
	"customer_payment",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		customerId: uuid("customer_id")
			.notNull()
			.references(() => client.id, { onDelete: "restrict" }),

		paymentNumber: varchar("payment_number", { length: 100 }).notNull(),
		paymentDate: timestamp("payment_date", { withTimezone: false }).notNull(),
		amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),

		paymentMethod: varchar("payment_method", { length: 50 })
			.notNull()
			.$type<"bank_transfer" | "check" | "cash" | "card" | "online">(),
		referenceNumber: varchar("reference_number", { length: 100 }), // Transaction ID, check number, etc.

		bankAccountId: uuid("bank_account_id"), // Future: link to bank_account table

		status: varchar("status", { length: 20 })
			.default("pending")
			.notNull()
			.$type<"pending" | "cleared" | "bounced" | "cancelled">(),

		notes: text("notes"),

		...softAudit,
	},
	(table) => [
		index("customer_payment_org_idx").on(table.organizationId),
		index("customer_payment_customer_idx").on(table.customerId),
		index("customer_payment_number_idx").on(
			table.organizationId,
			table.paymentNumber,
		),
		index("customer_payment_date_idx").on(table.paymentDate),
	],
);

/**
 * Customer Payment Allocations
 * Links payments to specific invoices (supports partial payments)
 */
export const customerPaymentAllocation = pgTable(
	"customer_payment_allocation",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		customerPaymentId: uuid("customer_payment_id")
			.notNull()
			.references(() => customerPayment.id, { onDelete: "cascade" }),
		customerInvoiceId: uuid("customer_invoice_id")
			.notNull()
			.references(() => customerInvoice.id, { onDelete: "cascade" }),

		allocatedAmount: numeric("allocated_amount", {
			precision: 12,
			scale: 2,
		}).notNull(),

		...softAudit,
	},
	(table) => [
		index("customer_payment_allocation_payment_idx").on(
			table.customerPaymentId,
		),
		index("customer_payment_allocation_invoice_idx").on(
			table.customerInvoiceId,
		),
	],
);
