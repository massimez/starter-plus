import { sql } from "drizzle-orm";
import {
	boolean,
	index,
	pgTable,
	text,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { softAudit } from "../helpers/common";
import { organization } from "../organization";

/**
 * ---------------------------------------------------------------------------
 * CHART OF ACCOUNTS (COA)
 * ---------------------------------------------------------------------------
 */

/**
 * Account Types - The five fundamental account types in accounting
 */
export const accountType = pgTable("account_type", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	name: varchar("name", { length: 50 })
		.notNull()
		.$type<"asset" | "liability" | "equity" | "revenue" | "expense">(),
	normalBalance: varchar("normal_balance", { length: 10 })
		.notNull()
		.$type<"debit" | "credit">(),
	description: text("description"),
});

/**
 * Account Categories - Subcategories within account types
 * Examples: "Current Assets", "Fixed Assets", "Current Liabilities", etc.
 */
export const accountCategory = pgTable(
	"account_category",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		accountTypeId: uuid("account_type_id")
			.notNull()
			.references(() => accountType.id, { onDelete: "restrict" }),

		name: varchar("name", { length: 100 }).notNull(),
		codePrefix: varchar("code_prefix", { length: 10 }), // e.g., "1000", "2000"
		description: text("description"),

		...softAudit,
	},
	(table) => [index("account_category_org_idx").on(table.organizationId)],
);

/**
 * GL Accounts - Individual GL accounts in the chart of accounts
 */
export const glAccount = pgTable(
	"gl_account",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		accountCategoryId: uuid("account_category_id")
			.notNull()
			.references(() => accountCategory.id, { onDelete: "restrict" }),

		// Account identification
		code: varchar("code", { length: 50 }).notNull(), // e.g., "1001", "4050"
		name: varchar("name", { length: 255 }).notNull(),
		description: text("description"),

		// Hierarchical structure for sub-accounts
		parentAccountId: uuid("parent_account_id").references(
			(): any => glAccount.id,
			{
				onDelete: "restrict",
			},
		),

		// Account controls
		isActive: boolean("is_active").default(true).notNull(),
		allowManualEntries: boolean("allow_manual_entries").default(true).notNull(),

		...softAudit,
	},
	(table) => [
		index("gl_account_org_idx").on(table.organizationId),
		index("gl_account_code_idx").on(table.organizationId, table.code),
		index("gl_account_category_idx").on(table.accountCategoryId),
		index("gl_account_parent_idx").on(table.parentAccountId),
	],
);
