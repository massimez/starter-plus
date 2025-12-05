import { sql } from "drizzle-orm";
import {
	boolean,
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

/**
 * ---------------------------------------------------------------------------
 * TAX MANAGEMENT
 * ---------------------------------------------------------------------------
 */

/**
 * Tax Authorities
 * Government tax authorities
 */
export const taxAuthority = pgTable(
	"tax_authority",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),

		name: varchar("name", { length: 255 }).notNull(),
		taxIdLabel: varchar("tax_id_label", { length: 100 }), // e.g., "VAT Number", "TIN"
		country: varchar("country", { length: 100 }),
		description: text("description"),

		...softAudit,
	},
	(table) => [index("tax_authority_org_idx").on(table.organizationId)],
);

/**
 * Tax Types
 * Different types of taxes with rates
 */
export const taxType = pgTable(
	"tax_type",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		taxAuthorityId: uuid("tax_authority_id")
			.notNull()
			.references(() => taxAuthority.id, { onDelete: "cascade" }),

		name: varchar("name", { length: 100 }).notNull(), // e.g., "VAT", "Sales Tax", "Withholding Tax"
		taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull(), // e.g., 15.00 for 15%

		effectiveFrom: timestamp("effective_from", {
			withTimezone: false,
		}).notNull(),
		effectiveTo: timestamp("effective_to", { withTimezone: false }),

		isActive: boolean("is_active").default(true).notNull(),

		...softAudit,
	},
	(table) => [
		index("tax_type_org_idx").on(table.organizationId),
		index("tax_type_authority_idx").on(table.taxAuthorityId),
		index("tax_type_effective_idx").on(table.effectiveFrom, table.effectiveTo),
	],
);

/**
 * Tax Transactions
 * Audit trail of all tax transactions
 */
export const taxTransaction = pgTable(
	"tax_transaction",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),

		// Polymorphic reference to source transaction
		transactionId: uuid("transaction_id").notNull(),
		transactionType: varchar("transaction_type", { length: 50 }).notNull(), // "invoice", "payment", etc.

		taxTypeId: uuid("tax_type_id")
			.notNull()
			.references(() => taxType.id, { onDelete: "restrict" }),

		taxableAmount: numeric("taxable_amount", {
			precision: 12,
			scale: 2,
		}).notNull(),
		taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).notNull(),
		transactionDate: timestamp("transaction_date", {
			withTimezone: false,
		}).notNull(),

		...softAudit,
	},
	(table) => [
		index("tax_transaction_org_idx").on(table.organizationId),
		index("tax_transaction_type_idx").on(table.taxTypeId),
		index("tax_transaction_source_idx").on(
			table.transactionType,
			table.transactionId,
		),
		index("tax_transaction_date_idx").on(table.transactionDate),
	],
);
