import { z } from "zod";
import { createRouter } from "@/lib/create-hono-app";
import {
	createErrorResponse,
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
import * as receivablesService from "./receivables.service";
import {
	createCustomerInvoiceSchema,
	recordCustomerPaymentSchema,
} from "./schema";

export default createRouter()
	.get(
		"/customer-invoices",
		authMiddleware,
		queryValidator(z.object({ limit: z.string().optional() })),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { limit } = c.req.valid("query");
				const invoices = await receivablesService.getCustomerInvoices(
					activeOrgId,
					limit ? Number(limit) : 50,
				);
				return c.json(createSuccessResponse(invoices));
			} catch (error) {
				return handleRouteError(c, error, "fetch customer invoices");
			}
		},
	)

	.get(
		"/customer-invoices/:id",
		authMiddleware,
		paramValidator(z.object({ id: z.string().uuid() })),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { id } = c.req.valid("param");
				const invoice = await receivablesService.getCustomerInvoice(
					activeOrgId,
					id,
				);

				if (!invoice) {
					return c.json(
						createErrorResponse("NotFoundError", "Customer invoice not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No customer invoice found with the provided id",
							},
						]),
						404,
					);
				}

				return c.json(createSuccessResponse(invoice));
			} catch (error) {
				return handleRouteError(c, error, "fetch customer invoice");
			}
		},
	)

	.post(
		"/customer-invoices",
		authMiddleware,
		jsonValidator(createCustomerInvoiceSchema),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const userId = c.get("user")?.id as string;
				const data = c.req.valid("json");
				const invoice = await receivablesService.createCustomerInvoice(
					activeOrgId,
					{
						...data,
						createdBy: userId,
					},
				);
				return c.json(createSuccessResponse(invoice), 201);
			} catch (error) {
				return handleRouteError(c, error, "create customer invoice");
			}
		},
	)

	.post(
		"/customer-invoices/:id/approve",
		authMiddleware,
		paramValidator(z.object({ id: z.string().uuid() })),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { id } = c.req.valid("param");
				const invoice = await receivablesService.approveCustomerInvoice(
					activeOrgId,
					id,
				);
				return c.json(createSuccessResponse(invoice));
			} catch (error) {
				return handleRouteError(c, error, "approve customer invoice");
			}
		},
	)

	.post(
		"/customer-payments",
		authMiddleware,
		jsonValidator(recordCustomerPaymentSchema),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const userId = c.get("user")?.id as string;
				const data = c.req.valid("json");
				const payment = await receivablesService.recordCustomerPayment(
					activeOrgId,
					{
						...data,
						createdBy: userId,
					},
				);
				return c.json(createSuccessResponse(payment), 201);
			} catch (error) {
				return handleRouteError(c, error, "record customer payment");
			}
		},
	)

	.get(
		"/customers/:id/balance",
		authMiddleware,
		paramValidator(z.object({ id: z.string().uuid() })),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { id } = c.req.valid("param");
				const balance = await receivablesService.getCustomerBalance(
					activeOrgId,
					id,
				);
				return c.json(createSuccessResponse({ balance }));
			} catch (error) {
				return handleRouteError(c, error, "fetch customer balance");
			}
		},
	);
