import { relations, sql } from "drizzle-orm";
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
import { user } from "../user";
import { glAccount } from "./accounts";

/**
 * ---------------------------------------------------------------------------
 * EXPENSE MANAGEMENT
 * ---------------------------------------------------------------------------
 */

/**
 * Expense Categories
 * Categories for classifying expenses (e.g., Travel, Meals, Office Supplies)
 */
export const expenseCategory = pgTable(
	"expense_category",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		name: varchar("name", { length: 100 }).notNull(),
		description: text("description"),
		// Link to GL Account for accounting
		glAccountId: uuid("gl_account_id").references(() => glAccount.id, {
			onDelete: "set null",
		}),
		isActive: boolean("is_active").default(true).notNull(),
		...softAudit,
	},
	(table) => [index("expense_category_org_idx").on(table.organizationId)],
);

/**
 * Expenses
 * Individual expense records incurred by employees or users
 */
export const expense = pgTable(
	"expense",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),

		// Who incurred the expense
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "restrict" }),

		categoryId: uuid("category_id")
			.notNull()
			.references(() => expenseCategory.id, { onDelete: "restrict" }),

		amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
		currency: varchar("currency", { length: 3 }).notNull(),
		expenseDate: timestamp("expense_date", { withTimezone: false }).notNull(),
		description: text("description").notNull(),

		// Receipt
		receiptUrl: text("receipt_url"),

		status: varchar("status", { length: 20 })
			.default("pending")
			.notNull()
			.$type<"pending" | "approved" | "rejected" | "paid">(), // Application-level validation

		// Approval
		approvedBy: text("approved_by").references(() => user.id, {
			onDelete: "set null",
		}),
		approvedAt: timestamp("approved_at", { withTimezone: false }),
		rejectionReason: text("rejection_reason"),

		...softAudit,
	},
	(table) => [
		index("expense_org_idx").on(table.organizationId),
		index("expense_user_idx").on(table.userId),
		index("expense_status_idx").on(table.status),
		index("expense_date_idx").on(table.expenseDate),
	],
);

export const expenseCategoryRelations = relations(
	expenseCategory,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [expenseCategory.organizationId],
			references: [organization.id],
		}),
		glAccount: one(glAccount, {
			fields: [expenseCategory.glAccountId],
			references: [glAccount.id],
		}),
		expenses: many(expense),
	}),
);

export const expenseRelations = relations(expense, ({ one }) => ({
	organization: one(organization, {
		fields: [expense.organizationId],
		references: [organization.id],
	}),
	category: one(expenseCategory, {
		fields: [expense.categoryId],
		references: [expenseCategory.id],
	}),
	user: one(user, {
		fields: [expense.userId],
		references: [user.id],
	}),
	approver: one(user, {
		fields: [expense.approvedBy],
		references: [user.id],
	}),
}));
