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
 * GL Accounts - flat structure
 * Combines account type, category, and account into a single table
 */
export const glAccount = pgTable(
	"gl_account",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),

		// Account identification
		code: varchar("code", { length: 50 }).notNull(), // e.g., "1001", "4050"
		name: varchar("name", { length: 255 }).notNull(),
		description: text("description"),

		// Account classification (embedded instead of separate tables)
		accountType: varchar("account_type", { length: 20 })
			.notNull()
			.$type<"asset" | "liability" | "equity" | "revenue" | "expense">(), // Application-level validation
		category: varchar("category", { length: 100 }), // e.g., "Current Assets", "Fixed Assets"
		normalBalance: varchar("normal_balance", { length: 10 })
			.notNull()
			.$type<"debit" | "credit">(), // Application-level validation

		// Account controls
		isActive: boolean("is_active").default(true).notNull(),
		allowManualEntries: boolean("allow_manual_entries").default(true).notNull(),

		...softAudit,
	},
	(table) => [
		index("gl_account_org_idx").on(table.organizationId),
		index("gl_account_code_idx").on(table.organizationId, table.code),
		index("gl_account_type_idx").on(table.accountType),
	],
);
