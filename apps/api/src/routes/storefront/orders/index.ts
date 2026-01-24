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
} from "@/lib/utils/validator";
import {
	createStorefrontOrder,
	getStorefrontOrder,
	getStorefrontOrders,
} from "./orders.service";

// Validation schemas
const shippingAddressSchema = z.object({
	street: z.string().optional(),
	city: z.string().min(1),
	state: z.string().min(1),
	country: z.string().optional(),
	postalCode: z.string().optional(),
});

const orderItemSchema = z.object({
	productVariantId: z.string().uuid(),
	quantity: z.number().int().positive(),
	locationId: z.string().uuid(),
});

const createOrderSchema = z.object({
	shippingAddress: shippingAddressSchema,
	items: z.array(orderItemSchema).min(1),
	currency: z.string().length(3),
	customerEmail: z.string().email().optional(),
	customerPhone: z.string().optional(),
	customerFullName: z.string().optional(),
	locationId: z.string().uuid(),
	userId: z.string().optional(),
	couponCode: z.string().optional(),
});

export const ordersRoutes = createRouter()
	// Create order
	.post(
		"/",

		jsonValidator(createOrderSchema),
		async (c) => {
			try {
				const payload = c.req.valid("json");
				const organizationId = c.var.tenantId;
				if (!organizationId) throw new Error("Organization ID required");

				const result = await createStorefrontOrder({
					...payload,
					organizationId,
				});
				return c.json(createSuccessResponse(result), 201);
			} catch (error) {
				// Handle stock errors specifically
				if (error instanceof Error && error.name === "StockError") {
					return c.json(
						createErrorResponse("BadRequestError", error.message, [
							{
								code: "INSUFFICIENT_STOCK",
								path: ["items"],
								message: error.message,
							},
						]),
						400,
					);
				}
				return handleRouteError(c, error, "create order");
			}
		},
	)
	// Get orders
	.get(
		"/",
		queryValidator(
			z.object({
				userId: z.string().min(1),
				limit: z.coerce.number().default(20),
				offset: z.coerce.number().default(0),
			}),
		),
		async (c) => {
			try {
				const query = c.req.valid("query");
				const organizationId = c.var.tenantId;
				if (!organizationId) throw new Error("Organization ID required");

				const orders = await getStorefrontOrders({ ...query, organizationId });
				return c.json(createSuccessResponse(orders));
			} catch (error) {
				return handleRouteError(c, error, "fetch storefront orders");
			}
		},
	)
	.get(
		"/:orderId",
		paramValidator(
			z.object({
				orderId: z.string().min(1),
			}),
		),
		queryValidator(
			z.object({
				userId: z.string().optional(),
			}),
		),
		async (c) => {
			try {
				const { orderId } = c.req.valid("param");
				const { userId } = c.req.valid("query");
				const organizationId = c.var.tenantId;
				if (!organizationId) throw new Error("Organization ID required");
				const order = await getStorefrontOrder({
					organizationId,
					orderId,
					userId,
				});

				if (!order) {
					return c.json(
						createErrorResponse("NotFoundError", "Order not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["orderId"],
								message: "Order not found",
							},
						]),
						404,
					);
				}

				return c.json(createSuccessResponse(order));
			} catch (error) {
				return handleRouteError(c, error, "fetch storefront order");
			}
		},
	);
