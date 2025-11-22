import { type AnyColumn, and, asc, count, desc, eq, isNull } from "drizzle-orm";
import { createRouter } from "@/lib/create-hono-app";
import { db } from "@/lib/db";
import { order } from "@/lib/db/schema";
import {
	createErrorResponse,
	createSuccessResponse,
	handleRouteError,
} from "@/lib/utils/route-helpers";
import {
	idParamSchema,
	jsonValidator,
	paramValidator,
	queryValidator,
	validateOrgId,
} from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import { hasOrgPermission } from "@/middleware/org-permission";
import { orderPaginationSchema } from "@/middleware/pagination";
import { cancelOrder, completeOrder, createOrder } from "./order.service";
import { createOrderSchema, updateOrderSchema } from "./schema";

export const orderRoute = createRouter()
	// CREATE order (status = pending, add bonusPending)
	.post(
		"/orders",
		authMiddleware,
		jsonValidator(createOrderSchema),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const user = c.get("user");
				const payload = c.req.valid("json");

				const result = await createOrder(payload, user, activeOrgId);

				return c.json(createSuccessResponse(result), 201);
			} catch (error) {
				return handleRouteError(c, error, "create order");
			}
		},
	)

	// GET orders (with pagination)
	.get(
		"/orders",
		authMiddleware,
		hasOrgPermission("order:read"),
		queryValidator(orderPaginationSchema),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);

				const { limit, offset, orderBy, direction, status } =
					c.req.valid("query");

				const whereConditions = [
					eq(order.organizationId, activeOrgId),
					isNull(order.deletedAt),
				];
				if (status) {
					whereConditions.push(eq(order.status, status));
				}

				const result = await db.query.order.findMany({
					where: (_o, { and }) => and(...whereConditions),
					with: {
						items: true,
					},
					limit,
					offset,
					orderBy: orderBy
						? direction === "asc"
							? asc(order[orderBy as keyof typeof order] as AnyColumn)
							: desc(order[orderBy as keyof typeof order] as AnyColumn)
						: desc(order.createdAt),
				});
				const totalResult = await db
					.select({ count: count() })
					.from(order)
					.where(and(...whereConditions));

				const total = Number(totalResult[0]?.count ?? 0);

				return c.json(
					createSuccessResponse({
						total,
						data: result,
					}),
				);
			} catch (error) {
				return handleRouteError(c, error, "fetch orders");
			}
		},
	)

	// GET single order
	.get(
		"/orders/:id",
		authMiddleware,
		hasOrgPermission("order:read"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const { id } = c.req.valid("param");
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);

				const result = await db.query.order.findFirst({
					where: (orders, { and, eq }) =>
						and(
							eq(orders.id, id),
							eq(orders.organizationId, activeOrgId),
							isNull(orders.deletedAt),
						),
					with: { items: true },
				});

				if (!result) {
					return c.json(
						createErrorResponse("NotFoundError", "Order not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No order found with the provided id",
							},
						]),
						404,
					);
				}

				return c.json(createSuccessResponse(result));
			} catch (error) {
				return handleRouteError(c, error, "fetch order");
			}
		},
	)

	// UPDATE order
	.patch(
		"/orders/:id",
		authMiddleware,
		hasOrgPermission("order:update"),
		paramValidator(idParamSchema),
		jsonValidator(updateOrderSchema),
		async (c) => {
			try {
				const { id } = c.req.valid("param");
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);

				const payload = c.req.valid("json");

				const [updated] = await db
					.update(order)
					.set(payload)
					.where(
						and(
							eq(order.id, id),
							eq(order.organizationId, activeOrgId),
							isNull(order.deletedAt),
						),
					)
					.returning();

				if (!updated) {
					return c.json(
						createErrorResponse("NotFoundError", "Order not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No order found with the provided id",
							},
						]),
						404,
					);
				}

				const result = await db.query.order.findFirst({
					where: eq(order.id, id),
					with: { items: true },
				});
				const items = result?.items || [];

				return c.json(createSuccessResponse({ ...updated, items }));
			} catch (error) {
				return handleRouteError(c, error, "update order");
			}
		},
	)

	// COMPLETE order (moves bonusPending → bonus, decreases reservedQuantity and quantity)
	.patch(
		"/orders/:id/complete",
		paramValidator(idParamSchema),
		hasOrgPermission("order:complete"),
		authMiddleware,
		async (c) => {
			try {
				const { id } = c.req.valid("param");
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);

				const ord = await completeOrder(id, activeOrgId);

				return c.json(
					createSuccessResponse(ord, "Order completed successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "complete order");
			}
		},
	)

	// CANCEL order (subtracts from bonusPending, decreases reservedQuantity)
	.patch(
		"/orders/:id/cancel",
		authMiddleware,
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const { id } = c.req.valid("param");
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);

				const ord = await cancelOrder(id, activeOrgId);

				return c.json(
					createSuccessResponse(ord, "Order cancelled successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "cancel order");
			}
		},
	)

	// DELETE order
	.delete(
		"/orders/:id",
		authMiddleware,
		hasOrgPermission("order:delete"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const { id } = c.req.valid("param");
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);

				const [deleted] = await db
					.update(order)
					.set({ deletedAt: new Date() })
					.where(
						and(
							eq(order.id, id),
							eq(order.organizationId, activeOrgId),
							isNull(order.deletedAt),
						),
					)
					.returning();

				if (!deleted) {
					return c.json(
						createErrorResponse(
							"NotFoundError",
							"Order not found or already deleted",
							[
								{
									code: "RESOURCE_NOT_FOUND",
									path: ["id"],
									message:
										"No order found with the provided id or already deleted",
								},
							],
						),
						404,
					);
				}

				return c.json(
					createSuccessResponse(deleted, "Order deleted successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "delete order");
			}
		},
	);
