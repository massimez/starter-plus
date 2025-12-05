import { z } from "zod";
import { createRouter } from "@/lib/create-hono-app";
import {
	createSuccessResponse,
	handleRouteError,
} from "@/lib/utils/route-helpers";
import { queryValidator, validateOrgId } from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import * as transactionsService from "./transactions.service";

export default createRouter().get(
	"/",
	authMiddleware,
	queryValidator(z.object({ limit: z.string().optional() })),
	async (c) => {
		try {
			const activeOrgId = validateOrgId(
				c.get("session")?.activeOrganizationId as string,
			);
			const { limit } = c.req.valid("query");
			const transactions =
				await transactionsService.getAllFinancialTransactions(
					activeOrgId,
					limit ? Number(limit) : 100,
				);
			return c.json(createSuccessResponse(transactions));
		} catch (error) {
			return handleRouteError(c, error, "fetch financial transactions");
		}
	},
);
