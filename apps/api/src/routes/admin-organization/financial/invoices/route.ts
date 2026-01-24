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
import * as invoicesService from "./invoices.service";
import {
	createInvoiceSchema,
	recordPaymentSchema,
	updateInvoiceSchema,
} from "./schema";

export default createRouter()
	// Get all invoices (with pagination and filters)
	.get(
		"/",
		authMiddleware,
		queryValidator(
			z.object({
				type: z.enum(["receivable", "payable"]).optional(),
				limit: z.string().optional(),
				offset: z.string().optional(),
				status: z.string().optional(),
				from: z.string().optional(),
				to: z.string().optional(),
			}),
		),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { type, limit, offset, status, from, to } = c.req.valid("query");
				const result = await invoicesService.getInvoices(activeOrgId, {
					invoiceType: type,
					limit: limit ? Number(limit) : 50,
					offset: offset ? Number(offset) : 0,
					status,
					from,
					to,
				});
				return c.json(createSuccessResponse(result));
			} catch (error) {
				return handleRouteError(c, error, "fetch invoices");
			}
		},
	)

	// Get invoice stats
	.get(
		"/stats",
		authMiddleware,
		queryValidator(
			z.object({
				type: z.enum(["receivable", "payable"]),
			}),
		),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { type } = c.req.valid("query");
				const stats = await invoicesService.getInvoiceStats(activeOrgId, type);
				return c.json(createSuccessResponse(stats));
			} catch (error) {
				return handleRouteError(c, error, "fetch invoice stats");
			}
		},
	)

	// Get single invoice
	.get(
		"/:id",
		authMiddleware,
		paramValidator(z.object({ id: z.string().uuid() })),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { id } = c.req.valid("param");
				const invoice = await invoicesService.getInvoice(activeOrgId, id);

				if (!invoice) {
					return c.json(
						createErrorResponse("NotFoundError", "Invoice not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No invoice found with the provided id",
							},
						]),
						404,
					);
				}

				return c.json(createSuccessResponse(invoice));
			} catch (error) {
				return handleRouteError(c, error, "fetch invoice");
			}
		},
	)

	// Create invoice
	.post("/", authMiddleware, jsonValidator(createInvoiceSchema), async (c) => {
		try {
			const activeOrgId = validateOrgId(
				c.get("session")?.activeOrganizationId as string,
			);
			const userId = c.get("user")?.id as string;
			const data = c.req.valid("json");
			const invoice = await invoicesService.createInvoice(activeOrgId, {
				...data,
				createdBy: userId,
			});
			return c.json(createSuccessResponse(invoice), 201);
		} catch (error) {
			return handleRouteError(c, error, "create invoice");
		}
	})

	// Update invoice
	.put(
		"/:id",
		authMiddleware,
		paramValidator(z.object({ id: z.string().uuid() })),
		jsonValidator(updateInvoiceSchema),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const userId = c.get("user")?.id as string;
				const { id } = c.req.valid("param");
				const data = c.req.valid("json");
				const invoice = await invoicesService.updateInvoice(activeOrgId, id, {
					...data,
					updatedBy: userId,
				});
				return c.json(createSuccessResponse(invoice));
			} catch (error) {
				return handleRouteError(c, error, "update invoice");
			}
		},
	)

	// Approve invoice
	.post(
		"/:id/approve",
		authMiddleware,
		paramValidator(z.object({ id: z.string().uuid() })),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const userId = c.get("user")?.id as string;
				const { id } = c.req.valid("param");
				const invoice = await invoicesService.approveInvoice(
					activeOrgId,
					id,
					userId,
				);
				return c.json(createSuccessResponse(invoice));
			} catch (error) {
				return handleRouteError(c, error, "approve invoice");
			}
		},
	)

	// Delete invoice
	.delete(
		"/:id",
		authMiddleware,
		paramValidator(z.object({ id: z.string().uuid() })),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { id } = c.req.valid("param");
				const invoice = await invoicesService.deleteInvoice(activeOrgId, id);
				return c.json(createSuccessResponse(invoice));
			} catch (error) {
				return handleRouteError(c, error, "delete invoice");
			}
		},
	)

	// Record payment
	.post(
		"/payments",
		authMiddleware,
		jsonValidator(recordPaymentSchema),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const userId = c.get("user")?.id as string;
				const data = c.req.valid("json");
				const payment = await invoicesService.recordPayment(activeOrgId, {
					...data,
					createdBy: userId,
				});
				return c.json(createSuccessResponse(payment), 201);
			} catch (error) {
				return handleRouteError(c, error, "record payment");
			}
		},
	)

	// Get payments
	.get(
		"/payments",
		authMiddleware,
		queryValidator(
			z.object({
				type: z.enum(["received", "sent"]).optional(),
				limit: z.string().optional(),
			}),
		),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { type, limit } = c.req.valid("query");
				const payments = await invoicesService.getPayments(activeOrgId, {
					paymentType: type,
					limit: limit ? Number(limit) : 50,
				});
				return c.json(createSuccessResponse(payments));
			} catch (error) {
				return handleRouteError(c, error, "fetch payments");
			}
		},
	)

	// Get party balance (customer or supplier)
	.get(
		"/balance/:partyType/:partyId",
		authMiddleware,
		paramValidator(
			z.object({
				partyType: z.enum(["customer", "supplier"]),
				partyId: z.string().uuid(),
			}),
		),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { partyType, partyId } = c.req.valid("param");
				const balance = await invoicesService.getPartyBalance(
					activeOrgId,
					partyId,
					partyType,
				);
				return c.json(createSuccessResponse({ balance }));
			} catch (error) {
				return handleRouteError(c, error, "fetch party balance");
			}
		},
	);
