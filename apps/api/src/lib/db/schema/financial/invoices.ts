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
import { supplier } from "../store/supplier";
import { glAccount } from "./accounts";

/**
 * ---------------------------------------------------------------------------
 * INVOICES - UNIFIED (Receivables & Payables)
 * ---------------------------------------------------------------------------
 */

/**
 * Invoices - Unified table for both customer and supplier invoices
 */
export const invoice = pgTable(
	"invoice",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),

		// Invoice type and party (polymorphic)
		invoiceType: varchar("invoice_type", { length: 20 })
			.notNull()
			.$type<"receivable" | "payable">(), // Application-level validation
		partyType: varchar("party_type", { length: 20 })
			.notNull()
			.$type<"customer" | "supplier">(), // Application-level validation

		// Polymorphic reference to either client or supplier
		customerId: uuid("customer_id").references(() => client.id, {
			onDelete: "restrict",
		}),
		supplierId: uuid("supplier_id").references(() => supplier.id, {
			onDelete: "restrict",
		}),

		// Invoice details
		invoiceNumber: varchar("invoice_number", { length: 100 }).notNull(),
		invoiceDate: timestamp("invoice_date", { withTimezone: false }).notNull(),
		dueDate: timestamp("due_date", { withTimezone: false }).notNull(),

		// Amounts
		currency: varchar("currency", { length: 3 }).notNull(), // ISO 4217
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
			.$type<"draft" | "sent" | "partial" | "paid" | "overdue" | "cancelled">(), // Application-level validation

		// Tracking
		sentAt: timestamp("sent_at", { withTimezone: false }),

		// Notes
		notes: text("notes"),

		...softAudit,
	},
	(table) => [
		index("invoice_org_idx").on(table.organizationId),
		index("invoice_customer_idx").on(table.customerId),
		index("invoice_supplier_idx").on(table.supplierId),
		index("invoice_number_idx").on(table.organizationId, table.invoiceNumber),
		index("invoice_status_idx").on(table.status),
		index("invoice_type_idx").on(table.invoiceType),
		index("invoice_due_date_idx").on(table.dueDate),
	],
);

/**
 * Invoice Lines - Line items for invoices
 */
export const invoiceLine = pgTable(
	"invoice_line",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		invoiceId: uuid("invoice_id")
			.notNull()
			.references(() => invoice.id, { onDelete: "cascade" }),
		accountId: uuid("account_id")
			.notNull()
			.references(() => glAccount.id, { onDelete: "restrict" }),

		description: text("description").notNull(),
		quantity: numeric("quantity", { precision: 12, scale: 4 }).default("1"),
		unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
		taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),
		taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0"),
		totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),

		...softAudit,
	},
	(table) => [
		index("invoice_line_invoice_idx").on(table.invoiceId),
		index("invoice_line_account_idx").on(table.accountId),
	],
);

/**
 * ---------------------------------------------------------------------------
 * PAYMENTS - UNIFIED (Received & Sent)
 * ---------------------------------------------------------------------------
 */

/**
 * Payments - Unified table for both customer and supplier payments
 */
export const payment = pgTable(
	"payment",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),

		// Payment type and party (polymorphic)
		paymentType: varchar("payment_type", { length: 20 })
			.notNull()
			.$type<"received" | "sent">(), // Application-level validation
		partyType: varchar("party_type", { length: 20 })
			.notNull()
			.$type<"customer" | "supplier">(), // Application-level validation

		// Polymorphic reference to either client or supplier
		customerId: uuid("customer_id").references(() => client.id, {
			onDelete: "restrict",
		}),
		supplierId: uuid("supplier_id").references(() => supplier.id, {
			onDelete: "restrict",
		}),

		paymentNumber: varchar("payment_number", { length: 100 }).notNull(),
		paymentDate: timestamp("payment_date", { withTimezone: false }).notNull(),
		amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),

		paymentMethod: varchar("payment_method", { length: 50 })
			.notNull()
			.$type<"bank_transfer" | "check" | "cash" | "card" | "online">(), // Application-level validation
		referenceNumber: varchar("reference_number", { length: 100 }),

		status: varchar("status", { length: 20 })
			.default("pending")
			.notNull()
			.$type<"pending" | "cleared" | "bounced" | "cancelled">(), // Application-level validation

		notes: text("notes"),

		...softAudit,
	},
	(table) => [
		index("payment_org_idx").on(table.organizationId),
		index("payment_customer_idx").on(table.customerId),
		index("payment_supplier_idx").on(table.supplierId),
		index("payment_number_idx").on(table.organizationId, table.paymentNumber),
		index("payment_type_idx").on(table.paymentType),
		index("payment_date_idx").on(table.paymentDate),
	],
);

/**
 * Payment Allocations - Links payments to invoices
 */
export const paymentAllocation = pgTable(
	"payment_allocation",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		paymentId: uuid("payment_id")
			.notNull()
			.references(() => payment.id, { onDelete: "cascade" }),
		invoiceId: uuid("invoice_id")
			.notNull()
			.references(() => invoice.id, { onDelete: "cascade" }),

		allocatedAmount: numeric("allocated_amount", {
			precision: 12,
			scale: 2,
		}).notNull(),

		...softAudit,
	},
	(table) => [
		index("payment_allocation_payment_idx").on(table.paymentId),
		index("payment_allocation_invoice_idx").on(table.invoiceId),
	],
);
