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
import * as payablesService from "./payables.service";
import {
	createSupplierInvoiceSchema,
	recordSupplierPaymentSchema,
} from "./schema";

export default createRouter()
	.get(
		"/supplier-invoices",
		authMiddleware,
		queryValidator(z.object({ limit: z.string().optional() })),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { limit } = c.req.valid("query");
				const invoices = await payablesService.getSupplierInvoices(
					activeOrgId,
					limit ? Number(limit) : 50,
				);
				return c.json(createSuccessResponse(invoices));
			} catch (error) {
				return handleRouteError(c, error, "fetch supplier invoices");
			}
		},
	)

	.get(
		"/supplier-invoices/:id",
		authMiddleware,
		paramValidator(z.object({ id: z.string().uuid() })),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { id } = c.req.valid("param");
				const invoice = await payablesService.getSupplierInvoice(
					activeOrgId,
					id,
				);

				if (!invoice) {
					return c.json(
						createErrorResponse("NotFoundError", "Supplier invoice not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No supplier invoice found with the provided id",
							},
						]),
						404,
					);
				}

				return c.json(createSuccessResponse(invoice));
			} catch (error) {
				return handleRouteError(c, error, "fetch supplier invoice");
			}
		},
	)

	.post(
		"/supplier-invoices",
		authMiddleware,
		jsonValidator(createSupplierInvoiceSchema),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const userId = c.get("user")?.id as string;
				const data = c.req.valid("json");
				const invoice = await payablesService.createSupplierInvoice(
					activeOrgId,
					{
						...data,
						createdBy: userId,
					},
				);
				return c.json(createSuccessResponse(invoice), 201);
			} catch (error) {
				return handleRouteError(c, error, "create supplier invoice");
			}
		},
	)

	.put(
		"/supplier-invoices/:id",
		authMiddleware,
		paramValidator(z.object({ id: z.string().uuid() })),
		jsonValidator(createSupplierInvoiceSchema),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const userId = c.get("user")?.id as string;
				const { id } = c.req.valid("param");
				const data = c.req.valid("json");
				const invoice = await payablesService.updateSupplierInvoice(
					activeOrgId,
					id,
					{
						...data,
						updatedBy: userId,
					},
				);
				return c.json(createSuccessResponse(invoice));
			} catch (error) {
				return handleRouteError(c, error, "update supplier invoice");
			}
		},
	)

	.post(
		"/supplier-invoices/:id/approve",
		authMiddleware,
		paramValidator(z.object({ id: z.string().uuid() })),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const userId = c.get("user")?.id as string;
				const { id } = c.req.valid("param");
				const invoice = await payablesService.approveSupplierInvoice(
					activeOrgId,
					id,
					userId,
				);
				return c.json(createSuccessResponse(invoice));
			} catch (error) {
				return handleRouteError(c, error, "approve supplier invoice");
			}
		},
	)

	.post(
		"/supplier-payments",
		authMiddleware,
		jsonValidator(recordSupplierPaymentSchema),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const userId = c.get("user")?.id as string;
				const data = c.req.valid("json");
				const payment = await payablesService.recordSupplierPayment(
					activeOrgId,
					{
						...data,
						createdBy: userId,
					},
				);
				return c.json(createSuccessResponse(payment), 201);
			} catch (error) {
				return handleRouteError(c, error, "record supplier payment");
			}
		},
	)

	.get(
		"/suppliers/:id/balance",
		authMiddleware,
		paramValidator(z.object({ id: z.string().uuid() })),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { id } = c.req.valid("param");
				const balance = await payablesService.getSupplierBalance(
					activeOrgId,
					id,
				);
				return c.json(createSuccessResponse({ balance }));
			} catch (error) {
				return handleRouteError(c, error, "fetch supplier balance");
			}
		},
	);
