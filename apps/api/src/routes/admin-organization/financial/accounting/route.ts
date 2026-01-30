import { z } from "zod";
import type { User } from "@/lib/auth";
import { createRouter } from "@/lib/create-hono-app";
import {
	createSuccessResponse,
	handleRouteError,
} from "@/lib/utils/route-helpers";
import {
	jsonValidator,
	paramValidator,
	validateOrgId,
} from "@/lib/utils/validator";
import { hasOrgPermission } from "@/middleware/org-permission";
import * as accountingService from "./accounting.service";
import {
	createAccountSchema,
	createJournalEntrySchema,
	updateAccountSchema,
} from "./schema";

export default createRouter()
	/**
	 * CHART OF ACCOUNTS ROUTES
	 */
	.get("/accounts", hasOrgPermission("account:read"), async (c) => {
		try {
			const activeOrgId = validateOrgId(
				c.get("session")?.activeOrganizationId as string,
			);
			const accounts = await accountingService.getChartOfAccounts(activeOrgId);
			return c.json(createSuccessResponse(accounts));
		} catch (error) {
			return handleRouteError(c, error, "fetch accounts");
		}
	})

	.post(
		"/accounts",
		hasOrgPermission("account:create"),
		jsonValidator(createAccountSchema),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const user = c.get("user") as User;
				const data = c.req.valid("json");
				const account = await accountingService.createAccount(
					activeOrgId,
					data,
					user,
				);
				return c.json(createSuccessResponse(account), 201);
			} catch (error) {
				return handleRouteError(c, error, "create account");
			}
		},
	)

	.patch(
		"/accounts/:id",
		hasOrgPermission("account:update"),
		paramValidator(z.object({ id: z.string().uuid() })),
		jsonValidator(updateAccountSchema),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const user = c.get("user") as User;
				const { id } = c.req.valid("param");
				const data = c.req.valid("json");
				const account = await accountingService.updateAccount(
					activeOrgId,
					id,
					data,
					user,
				);
				return c.json(createSuccessResponse(account));
			} catch (error) {
				return handleRouteError(c, error, "update account");
			}
		},
	)

	/**
	 * JOURNAL ENTRY ROUTES
	 */
	.get("/journal-entries", hasOrgPermission("journal:read"), async (c) => {
		try {
			const activeOrgId = validateOrgId(
				c.get("session")?.activeOrganizationId as string,
			);
			const entries = await accountingService.getJournalEntries(activeOrgId);
			return c.json(createSuccessResponse(entries));
		} catch (error) {
			return handleRouteError(c, error, "fetch journal entries");
		}
	})

	.post(
		"/journal-entries",
		hasOrgPermission("journal:create"),
		jsonValidator(createJournalEntrySchema),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const userId = c.get("user")?.id as string;
				const data = c.req.valid("json");
				const entry = await accountingService.createJournalEntry(activeOrgId, {
					...data,
					createdBy: userId,
				});
				return c.json(createSuccessResponse(entry), 201);
			} catch (error) {
				return handleRouteError(c, error, "create journal entry");
			}
		},
	)

	.post(
		"/journal-entries/:id/post",
		hasOrgPermission("journal:post"),
		paramValidator(z.object({ id: z.string().uuid() })),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const userId = c.get("user")?.id as string;
				const { id } = c.req.valid("param");
				const entry = await accountingService.postJournalEntry(
					activeOrgId,
					id,
					userId,
				);
				return c.json(createSuccessResponse(entry));
			} catch (error) {
				return handleRouteError(c, error, "post journal entry");
			}
		},
	)

	.get("/trial-balance", hasOrgPermission("report:read"), async (c) => {
		try {
			const activeOrgId = validateOrgId(
				c.get("session")?.activeOrganizationId as string,
			);
			const asOfParam = c.req.query("asOf");
			const asOf = asOfParam ? new Date(asOfParam) : new Date();
			const report = await accountingService.getTrialBalance(activeOrgId, asOf);
			return c.json(createSuccessResponse(report));
		} catch (error) {
			return handleRouteError(c, error, "fetch trial balance");
		}
	})

	.delete(
		"/journal-entries/:id",
		hasOrgPermission("journal:delete"),
		paramValidator(z.object({ id: z.string().uuid() })),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { id } = c.req.valid("param");
				const deleted = await accountingService.deleteJournalEntry(
					activeOrgId,
					id,
				);
				return c.json(createSuccessResponse(deleted));
			} catch (error) {
				return handleRouteError(c, error, "delete journal entry");
			}
		},
	);
