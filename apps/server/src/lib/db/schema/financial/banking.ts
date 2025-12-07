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
import { glAccount } from "./accounts";

/**
 * ---------------------------------------------------------------------------
 * BANKING & CASH MANAGEMENT
 * ---------------------------------------------------------------------------
 */

/**
 * Bank Accounts
 */
export const bankAccount = pgTable(
	"bank_account",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),

		// Account details
		accountName: varchar("account_name", { length: 255 }).notNull(),
		bankName: varchar("bank_name", { length: 255 }).notNull(),
		accountNumber: varchar("account_number", { length: 100 }).notNull(),
		iban: varchar("iban", { length: 100 }),
		swiftCode: varchar("swift_code", { length: 20 }),

		currency: varchar("currency", { length: 3 }).notNull(),
		accountType: varchar("account_type", { length: 20 })
			.notNull()
			.$type<"checking" | "savings" | "credit">(), // Application-level validation

		// GL integration
		glAccountId: uuid("gl_account_id")
			.notNull()
			.references(() => glAccount.id, { onDelete: "restrict" }),

		// Balance
		currentBalance: numeric("current_balance", {
			precision: 12,
			scale: 2,
		}).default("0"),

		isActive: boolean("is_active").default(true).notNull(),

		...softAudit,
	},
	(table) => [
		index("bank_account_org_idx").on(table.organizationId),
		index("bank_account_gl_idx").on(table.glAccountId),
	],
);

/**
 * Bank Transactions
 * Individual bank transactions
 */
export const bankTransaction = pgTable(
	"bank_transaction",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		bankAccountId: uuid("bank_account_id")
			.notNull()
			.references(() => bankAccount.id, { onDelete: "cascade" }),

		transactionDate: timestamp("transaction_date", {
			withTimezone: false,
		}).notNull(),

		transactionType: varchar("transaction_type", { length: 20 })
			.notNull()
			.$type<"deposit" | "withdrawal" | "transfer" | "fee" | "interest">(), // Application-level validation

		amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
		balanceAfter: numeric("balance_after", { precision: 12, scale: 2 }),

		referenceNumber: varchar("reference_number", { length: 100 }),
		description: text("description"),
		payeePayer: varchar("payee_payer", { length: 255 }),

		...softAudit,
	},
	(table) => [
		index("bank_transaction_org_idx").on(table.organizationId),
		index("bank_transaction_account_idx").on(table.bankAccountId),
		index("bank_transaction_date_idx").on(table.transactionDate),
	],
);
