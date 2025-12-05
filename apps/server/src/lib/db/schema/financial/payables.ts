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
import { supplier } from "../store/supplier";
import { user } from "../user";
import { glAccount } from "./accounts";

/**
 * ---------------------------------------------------------------------------
 * ACCOUNTS PAYABLE (AP) - Reuses existing supplier table
 * ---------------------------------------------------------------------------
 */

/**
 * Supplier Invoices
 * Tracks invoices received from suppliers (vendors)
 */
export const supplierInvoice = pgTable(
	"supplier_invoice",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		supplierId: uuid("supplier_id")
			.notNull()
			.references(() => supplier.id, { onDelete: "restrict" }),

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
				| "draft"
				| "approved"
				| "partially_paid"
				| "paid"
				| "overdue"
				| "cancelled"
			>(),
		paymentStatus: varchar("payment_status", { length: 20 })
			.default("unpaid")
			.$type<"unpaid" | "partially_paid" | "paid">(),

		// Approval tracking
		approvedBy: text("approved_by").references(() => user.id, {
			onDelete: "set null",
		}),
		approvedAt: timestamp("approved_at", { withTimezone: false }),

		// Notes
		notes: text("notes"),

		...softAudit,
	},
	(table) => [
		index("supplier_invoice_org_idx").on(table.organizationId),
		index("supplier_invoice_supplier_idx").on(table.supplierId),
		index("supplier_invoice_number_idx").on(
			table.organizationId,
			table.invoiceNumber,
		),
		index("supplier_invoice_status_idx").on(table.status),
		index("supplier_invoice_due_date_idx").on(table.dueDate),
	],
);

/**
 * Supplier Invoice Lines
 * Line items for supplier invoices
 */
export const supplierInvoiceLine = pgTable(
	"supplier_invoice_line",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		supplierInvoiceId: uuid("supplier_invoice_id")
			.notNull()
			.references(() => supplierInvoice.id, { onDelete: "cascade" }),
		expenseAccountId: uuid("expense_account_id")
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
		index("supplier_invoice_line_invoice_idx").on(table.supplierInvoiceId),
		index("supplier_invoice_line_account_idx").on(table.expenseAccountId),
	],
);

/**
 * Supplier Payments
 * Payments made to suppliers
 */
export const supplierPayment = pgTable(
	"supplier_payment",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		supplierId: uuid("supplier_id")
			.notNull()
			.references(() => supplier.id, { onDelete: "restrict" }),

		paymentNumber: varchar("payment_number", { length: 100 }).notNull(),
		paymentDate: timestamp("payment_date", { withTimezone: false }).notNull(),
		amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),

		paymentMethod: varchar("payment_method", { length: 50 })
			.notNull()
			.$type<"bank_transfer" | "check" | "cash" | "card">(),
		referenceNumber: varchar("reference_number", { length: 100 }), // Check number, transaction ID, etc.

		bankAccountId: uuid("bank_account_id"), // Future: link to bank_account table

		status: varchar("status", { length: 20 })
			.default("pending")
			.notNull()
			.$type<"pending" | "cleared" | "cancelled">(),

		notes: text("notes"),

		...softAudit,
	},
	(table) => [
		index("supplier_payment_org_idx").on(table.organizationId),
		index("supplier_payment_supplier_idx").on(table.supplierId),
		index("supplier_payment_number_idx").on(
			table.organizationId,
			table.paymentNumber,
		),
		index("supplier_payment_date_idx").on(table.paymentDate),
	],
);

/**
 * Supplier Payment Allocations
 * Links payments to specific invoices (supports partial payments)
 */
export const supplierPaymentAllocation = pgTable(
	"supplier_payment_allocation",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		supplierPaymentId: uuid("supplier_payment_id")
			.notNull()
			.references(() => supplierPayment.id, { onDelete: "cascade" }),
		supplierInvoiceId: uuid("supplier_invoice_id")
			.notNull()
			.references(() => supplierInvoice.id, { onDelete: "cascade" }),

		allocatedAmount: numeric("allocated_amount", {
			precision: 12,
			scale: 2,
		}).notNull(),

		...softAudit,
	},
	(table) => [
		index("supplier_payment_allocation_payment_idx").on(
			table.supplierPaymentId,
		),
		index("supplier_payment_allocation_invoice_idx").on(
			table.supplierInvoiceId,
		),
	],
);
