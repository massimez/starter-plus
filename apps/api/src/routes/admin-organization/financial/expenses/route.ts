import { z } from "zod";
import { createRouter } from "@/lib/create-hono-app";
import {
	createSuccessResponse,
	handleRouteError,
} from "@/lib/utils/route-helpers";
import {
	jsonValidator,
	paramValidator,
	queryValidator,
	validateOrgId,
} from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import * as expensesService from "./expenses.service";

const createExpenseSchema = z.object({
	categoryId: z.string().uuid(),
	amount: z.number().positive(),
	currency: z.string().length(3),
	expenseDate: z.coerce.date(),
	description: z.string().min(1),
	receiptUrl: z.string().url().optional(),
});

const createCategorySchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	glAccountId: z.string().uuid().optional(),
});

export default createRouter()
	.get(
		"/expenses",
		authMiddleware,
		queryValidator(
			z.object({
				limit: z.string().optional(),
				offset: z.string().optional(),
				status: z.string().optional(),
				from: z.string().optional(),
				to: z.string().optional(),
				categoryId: z.string().optional(),
			}),
		),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { limit, offset, status, from, to, categoryId } =
					c.req.valid("query");
				const expenses = await expensesService.getExpenses(activeOrgId, {
					limit: limit ? Number(limit) : 50,
					offset: offset ? Number(offset) : 0,
					status,
					from,
					to,
					categoryId,
				});
				return c.json(createSuccessResponse(expenses));
			} catch (error) {
				return handleRouteError(c, error, "fetch expenses");
			}
		},
	)
	.post(
		"/expenses",
		authMiddleware,
		jsonValidator(createExpenseSchema),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const userId = c.get("user")?.id as string;
				const data = c.req.valid("json");
				const expense = await expensesService.createExpense(activeOrgId, {
					...data,
					userId,
					createdBy: userId,
				});
				return c.json(createSuccessResponse(expense), 201);
			} catch (error) {
				return handleRouteError(c, error, "create expense");
			}
		},
	)
	.post(
		"/expenses/:id/approve",
		authMiddleware,
		paramValidator(z.object({ id: z.string().uuid() })),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const userId = c.get("user")?.id as string;
				const { id } = c.req.valid("param");
				const expense = await expensesService.approveExpense(
					activeOrgId,
					id,
					userId,
				);
				return c.json(createSuccessResponse(expense));
			} catch (error) {
				return handleRouteError(c, error, "approve expense");
			}
		},
	)
	.post(
		"/expenses/:id/reject",
		authMiddleware,
		paramValidator(z.object({ id: z.string().uuid() })),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const userId = c.get("user")?.id as string;
				const { id } = c.req.valid("param");
				const expense = await expensesService.rejectExpense(
					activeOrgId,
					id,
					userId,
				);
				return c.json(createSuccessResponse(expense));
			} catch (error) {
				return handleRouteError(c, error, "reject expense");
			}
		},
	)
	.put(
		"/expenses/:id",
		authMiddleware,
		paramValidator(z.object({ id: z.string().uuid() })),
		jsonValidator(createExpenseSchema.partial()),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { id } = c.req.valid("param");
				const data = c.req.valid("json");
				const expense = await expensesService.updateExpense(
					activeOrgId,
					id,
					data,
				);
				return c.json(createSuccessResponse(expense));
			} catch (error) {
				return handleRouteError(c, error, "update expense");
			}
		},
	)
	.post(
		"/expenses/:id/pay",
		authMiddleware,
		paramValidator(z.object({ id: z.string().uuid() })),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { id } = c.req.valid("param");
				const expense = await expensesService.payExpense(activeOrgId, id);
				return c.json(createSuccessResponse(expense));
			} catch (error) {
				return handleRouteError(c, error, "pay expense");
			}
		},
	)
	.get("/expense-categories", authMiddleware, async (c) => {
		try {
			const activeOrgId = validateOrgId(
				c.get("session")?.activeOrganizationId as string,
			);
			const categories =
				await expensesService.getExpenseCategories(activeOrgId);
			return c.json(createSuccessResponse(categories));
		} catch (error) {
			return handleRouteError(c, error, "fetch expense categories");
		}
	})
	.post(
		"/expense-categories",
		authMiddleware,
		jsonValidator(createCategorySchema),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const data = c.req.valid("json");
				const category = await expensesService.createExpenseCategory(
					activeOrgId,
					data,
				);
				return c.json(createSuccessResponse(category), 201);
			} catch (error) {
				return handleRouteError(c, error, "create expense category");
			}
		},
	);
