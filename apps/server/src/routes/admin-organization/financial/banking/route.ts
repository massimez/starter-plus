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
import * as bankingService from "./banking.service";
import { createBankAccountSchema, recordBankTransactionSchema } from "./schema";

export default createRouter()
	.get("/bank-accounts", authMiddleware, async (c) => {
		try {
			const activeOrgId = validateOrgId(
				c.get("session")?.activeOrganizationId as string,
			);
			const accounts = await bankingService.getBankAccounts(activeOrgId);
			return c.json(createSuccessResponse(accounts));
		} catch (error) {
			return handleRouteError(c, error, "fetch bank accounts");
		}
	})

	.post(
		"/bank-accounts",
		authMiddleware,
		jsonValidator(createBankAccountSchema),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const userId = c.get("user")?.id as string;
				const data = c.req.valid("json");
				const account = await bankingService.createBankAccount(activeOrgId, {
					...data,
					createdBy: userId,
				});
				return c.json(createSuccessResponse(account), 201);
			} catch (error) {
				return handleRouteError(c, error, "create bank account");
			}
		},
	)

	.post("/bank-accounts/cash/ensure", authMiddleware, async (c) => {
		try {
			const activeOrgId = validateOrgId(
				c.get("session")?.activeOrganizationId as string,
			);
			const userId = c.get("user")?.id as string;
			const account = await bankingService.getOrCreateDefaultCashAccount(
				activeOrgId,
				userId,
			);
			return c.json(createSuccessResponse(account), 201);
		} catch (error) {
			return handleRouteError(c, error, "ensure cash account");
		}
	})

	.get(
		"/bank-transactions",
		authMiddleware,
		queryValidator(z.object({ limit: z.string().optional() })),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { limit } = c.req.valid("query");
				const transactions = await bankingService.getAllBankTransactions(
					activeOrgId,
					limit ? Number(limit) : 50,
				);
				return c.json(createSuccessResponse(transactions));
			} catch (error) {
				return handleRouteError(c, error, "fetch bank transactions");
			}
		},
	)

	.post(
		"/bank-transactions",
		authMiddleware,
		jsonValidator(recordBankTransactionSchema),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const userId = c.get("user")?.id as string;
				const data = c.req.valid("json");
				const transaction = await bankingService.recordBankTransaction(
					activeOrgId,
					{
						...data,
						createdBy: userId,
					},
				);
				return c.json(createSuccessResponse(transaction), 201);
			} catch (error) {
				return handleRouteError(c, error, "record bank transaction");
			}
		},
	)

	.get(
		"/bank-accounts/:id/transactions",
		authMiddleware,
		paramValidator(z.object({ id: z.string().uuid() })),
		queryValidator(z.object({ limit: z.string().optional() })),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { id } = c.req.valid("param");
				const { limit } = c.req.valid("query");
				const transactions = await bankingService.getBankTransactions(
					activeOrgId,
					id,
					limit ? Number(limit) : 50,
				);
				return c.json(createSuccessResponse(transactions));
			} catch (error) {
				return handleRouteError(c, error, "fetch bank account transactions");
			}
		},
	)

	.post(
		"/bank-transactions/:id/reconcile",
		authMiddleware,
		paramValidator(z.object({ id: z.string().uuid() })),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const userId = c.get("user")?.id as string;
				const { id } = c.req.valid("param");
				const transaction = await bankingService.reconcileBankTransaction(
					activeOrgId,
					id,
					userId,
				);
				return c.json(createSuccessResponse(transaction));
			} catch (error) {
				return handleRouteError(c, error, "reconcile bank transaction");
			}
		},
	);
