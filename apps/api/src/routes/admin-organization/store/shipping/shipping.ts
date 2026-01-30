import type { User } from "@/lib/auth";
import { createRouter } from "@/lib/create-hono-app";
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
} from "@/lib/utils/validator";
import { hasOrgPermission } from "@/middleware/org-permission";
import { offsetPaginationSchema } from "@/middleware/pagination";
import {
	insertShippingMethodSchema,
	updateShippingMethodSchema,
} from "./schema";
import {
	createShippingMethod,
	deleteShippingMethod,
	getShippingMethod,
	getShippingMethods,
	updateShippingMethod,
} from "./shipping.service";

export const shippingMethodRoute = createRouter()
	.post(
		"/shipping-methods",
		hasOrgPermission("shipping:create"),
		jsonValidator(insertShippingMethodSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const user = c.get("user") as User;
				const data = c.req.valid("json");
				const newShippingMethod = await createShippingMethod(
					data,
					activeOrgId,
					user,
				);
				return c.json(createSuccessResponse(newShippingMethod), 201);
			} catch (error) {
				return handleRouteError(c, error, "create shipping method");
			}
		},
	)
	.get(
		"/shipping-methods",
		hasOrgPermission("shipping:read"),
		queryValidator(offsetPaginationSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const paginationParams = c.req.valid("query");
				const result = await getShippingMethods(paginationParams, activeOrgId);
				return c.json(createSuccessResponse(result));
			} catch (error) {
				return handleRouteError(c, error, "fetch shipping methods");
			}
		},
	)
	.get(
		"/shipping-methods/:id",
		hasOrgPermission("shipping:read"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const foundShippingMethod = await getShippingMethod(id, activeOrgId);
				if (!foundShippingMethod) {
					return c.json(
						createErrorResponse("NotFoundError", "Shipping method not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No shipping method found with the provided id",
							},
						]),
						404,
					);
				}
				return c.json(createSuccessResponse(foundShippingMethod));
			} catch (error) {
				return handleRouteError(c, error, "fetch shipping method");
			}
		},
	)
	.put(
		"/shipping-methods/:id",
		hasOrgPermission("shipping:update"),
		paramValidator(idParamSchema),
		jsonValidator(updateShippingMethodSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const user = c.get("user") as User;
				const { id } = c.req.valid("param");
				const data = c.req.valid("json");
				const updatedShippingMethod = await updateShippingMethod(
					id,
					data,
					activeOrgId,
					user,
				);
				if (!updatedShippingMethod) {
					return c.json(
						createErrorResponse("NotFoundError", "Shipping method not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No shipping method found with the provided id",
							},
						]),
						404,
					);
				}
				return c.json(createSuccessResponse(updatedShippingMethod));
			} catch (error) {
				return handleRouteError(c, error, "update shipping method");
			}
		},
	)
	.delete(
		"/shipping-methods/:id",
		hasOrgPermission("shipping:delete"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const user = c.get("user") as User;
				const { id } = c.req.valid("param");
				const deletedShippingMethod = await deleteShippingMethod(
					id,
					activeOrgId,
					user,
				);
				if (!deletedShippingMethod) {
					return c.json(
						createErrorResponse(
							"NotFoundError",
							"Shipping method not found or already deleted",
							[
								{
									code: "RESOURCE_NOT_FOUND",
									path: ["id"],
									message:
										"No shipping method found with the provided id or already deleted",
								},
							],
						),
						404,
					);
				}
				return c.json(
					createSuccessResponse(
						deletedShippingMethod,
						"Shipping method deleted successfully",
					),
				);
			} catch (error) {
				return handleRouteError(c, error, "shipping method delete");
			}
		},
	);
