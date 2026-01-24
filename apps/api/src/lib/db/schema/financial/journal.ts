import { sql } from "drizzle-orm";
import {
	check,
	index,
	integer,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { softAudit } from "../helpers/common";
import { organization } from "../organization";
import { user } from "../user";
import { glAccount } from "./accounts";

/**
 * ---------------------------------------------------------------------------
 * JOURNAL ENTRIES - Double-Entry Accounting System
 * ---------------------------------------------------------------------------
 */

/**
 * Journal Entry Header
 */
export const journalEntry = pgTable(
	"journal_entry",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),

		// Entry identification
		entryNumber: varchar("entry_number", { length: 50 }).notNull(),
		entryDate: timestamp("entry_date", { withTimezone: false }).notNull(),
		postingDate: timestamp("posting_date", { withTimezone: false }),

		// Entry classification
		entryType: varchar("entry_type", { length: 50 })
			.notNull()
			.$type<"manual" | "automatic" | "adjustment">(), // Application-level validation

		// Source document reference (polymorphic)
		referenceType: varchar("reference_type", { length: 50 }), // "invoice", "payment", "payroll", etc.
		referenceId: uuid("reference_id"),

		description: text("description").notNull(),

		// Status workflow
		status: varchar("status", { length: 20 })
			.default("draft")
			.notNull()
			.$type<"draft" | "posted">(), // Application-level validation

		// Approval tracking
		approvedBy: text("approved_by").references(() => user.id, {
			onDelete: "set null",
		}),
		approvedAt: timestamp("approved_at", { withTimezone: false }),

		...softAudit,
	},
	(table) => [
		index("journal_entry_org_idx").on(table.organizationId),
		index("journal_entry_number_idx").on(
			table.organizationId,
			table.entryNumber,
		),
		index("journal_entry_date_idx").on(table.entryDate),
		index("journal_entry_status_idx").on(table.status),
		index("journal_entry_reference_idx").on(
			table.referenceType,
			table.referenceId,
		),
	],
);

/**
 * Journal Entry Lines
 */
export const journalEntryLine = pgTable(
	"journal_entry_line",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		journalEntryId: uuid("journal_entry_id")
			.notNull()
			.references(() => journalEntry.id, { onDelete: "cascade" }),
		accountId: uuid("account_id")
			.notNull()
			.references(() => glAccount.id, { onDelete: "restrict" }),

		// Amounts - one must be zero, enforced by CHECK constraint
		debitAmount: numeric("debit_amount", { precision: 19, scale: 4 })
			.default("0")
			.notNull(),
		creditAmount: numeric("credit_amount", { precision: 19, scale: 4 })
			.default("0")
			.notNull(),

		description: text("description"),
		lineNumber: integer("line_number").notNull(), // Order of lines in entry

		...softAudit,
	},
	(table) => [
		index("journal_entry_line_entry_idx").on(table.journalEntryId),
		index("journal_entry_line_account_idx").on(table.accountId),
		// CHECK constraint: one amount must be zero, the other must be positive
		check(
			"check_debit_or_credit",
			sql`(${table.debitAmount} > 0 AND ${table.creditAmount} = 0) OR (${table.creditAmount} > 0 AND ${table.debitAmount} = 0)`,
		),
	],
);
