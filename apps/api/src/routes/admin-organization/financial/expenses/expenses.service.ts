import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { expense, expenseCategory } from "@/lib/db/schema/financial/expenses";

export async function createExpenseCategory(
	organizationId: string,
	data: {
		name: string;
		description?: string;
		glAccountId?: string;
	},
) {
	const [category] = await db
		.insert(expenseCategory)
		.values({
			organizationId,
			name: data.name,
			description: data.description,
			glAccountId: data.glAccountId,
		})
		.returning();
	return category;
}

export async function getExpenseCategories(organizationId: string) {
	return await db.query.expenseCategory.findMany({
		where: eq(expenseCategory.organizationId, organizationId),
	});
}

export async function createExpense(
	organizationId: string,
	data: {
		categoryId: string;
		amount: number;
		currency: string;
		expenseDate: Date;
		description: string;
		userId: string;
		receiptUrl?: string;
		createdBy?: string;
	},
) {
	const [newExpense] = await db
		.insert(expense)
		.values({
			organizationId,
			categoryId: data.categoryId,
			amount: data.amount.toString(),
			currency: data.currency,
			expenseDate: data.expenseDate,
			description: data.description,
			userId: data.userId,
			receiptUrl: data.receiptUrl,
			status: "pending",
			createdBy: data.createdBy,
		})
		.returning();
	return newExpense;
}

export async function getExpenses(
	organizationId: string,
	options: {
		limit?: number;
		offset?: number;
		status?: string;
		from?: string;
		to?: string;
		categoryId?: string;
	} = {},
) {
	const { limit = 50, offset = 0, status, from, to, categoryId } = options;

	const where = and(
		eq(expense.organizationId, organizationId),
		status
			? eq(
					expense.status,
					// biome-ignore lint/suspicious/noExplicitAny: inference issue
					status as any,
				)
			: undefined,
		categoryId ? eq(expense.categoryId, categoryId) : undefined,
		from ? gte(expense.expenseDate, new Date(from)) : undefined,
		to ? lte(expense.expenseDate, new Date(to)) : undefined,
	);

	const [totalRes] = await db
		.select({ count: count() })
		.from(expense)
		.where(where);
	const total = totalRes?.count ?? 0;

	const data = await db.query.expense.findMany({
		where,
		orderBy: [desc(expense.expenseDate)],
		with: {
			category: true,
			user: true,
		},
		limit,
		offset,
	});

	return {
		data,
		meta: {
			total,
			page: Math.floor(offset / limit) + 1,
			pageSize: limit,
			totalPages: Math.ceil(total / limit),
		},
	};
}
export async function approveExpense(
	organizationId: string,
	expenseId: string,
	userId: string,
) {
	const [updatedExpense] = await db
		.update(expense)
		.set({
			status: "approved",
			approvedBy: userId,
			approvedAt: new Date(),
		})
		.where(
			and(
				eq(expense.id, expenseId),
				eq(expense.organizationId, organizationId),
				eq(expense.status, "pending"),
			),
		)
		.returning();

	if (!updatedExpense) {
		throw new Error("Expense not found or not pending");
	}

	return updatedExpense;
}

export async function rejectExpense(
	organizationId: string,
	expenseId: string,
	userId: string,
) {
	const [updatedExpense] = await db
		.update(expense)
		.set({
			status: "rejected",
			approvedBy: userId, // We use the same field for the person who acted on it
			approvedAt: new Date(),
		})
		.where(
			and(
				eq(expense.id, expenseId),
				eq(expense.organizationId, organizationId),
				eq(expense.status, "pending"),
			),
		)
		.returning();

	if (!updatedExpense) {
		throw new Error("Expense not found or not pending");
	}

	return updatedExpense;
}

export async function updateExpense(
	organizationId: string,
	expenseId: string,
	data: {
		categoryId?: string;
		amount?: number;
		currency?: string;
		expenseDate?: Date;
		description?: string;
		receiptUrl?: string;
	},
) {
	const [updatedExpense] = await db
		.update(expense)
		.set({
			categoryId: data.categoryId,
			amount: data.amount ? data.amount.toString() : undefined,
			currency: data.currency,
			expenseDate: data.expenseDate,
			description: data.description,
			receiptUrl: data.receiptUrl,
		})
		.where(
			and(
				eq(expense.id, expenseId),
				eq(expense.organizationId, organizationId),
				eq(expense.status, "pending"), // Only allow editing pending expenses
			),
		)
		.returning();

	if (!updatedExpense) {
		throw new Error(
			"Expense not found, not pending, or you don't have permission to edit it",
		);
	}

	return updatedExpense;
}

export async function payExpense(organizationId: string, expenseId: string) {
	const [updatedExpense] = await db
		.update(expense)
		.set({
			status: "paid",
		})
		.where(
			and(
				eq(expense.id, expenseId),
				eq(expense.organizationId, organizationId),
				eq(expense.status, "approved"), // Only allow paying approved expenses
			),
		)
		.returning();

	if (!updatedExpense) {
		throw new Error("Expense not found or not approved");
	}

	return updatedExpense;
}
