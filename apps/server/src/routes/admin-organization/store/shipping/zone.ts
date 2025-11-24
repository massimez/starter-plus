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
import { authMiddleware } from "@/middleware/auth";
import { hasOrgPermission } from "@/middleware/org-permission";
import { offsetPaginationSchema } from "@/middleware/pagination";
import { insertShippingZoneSchema, updateShippingZoneSchema } from "./schema";
import {
	createShippingZone,
	deleteShippingZone,
	getShippingZone,
	getShippingZones,
	updateShippingZone,
} from "./zone.service";

export const shippingZoneRoute = createRouter()
	.post(
		"/shipping-zones",
		authMiddleware,
		hasOrgPermission("shipping:create"),
		jsonValidator(insertShippingZoneSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const data = c.req.valid("json");
				const newShippingZone = await createShippingZone(data, activeOrgId);
				return c.json(createSuccessResponse(newShippingZone), 201);
			} catch (error) {
				return handleRouteError(c, error, "create shipping zone");
			}
		},
	)
	.get(
		"/shipping-zones",
		authMiddleware,
		hasOrgPermission("shipping:read"),
		queryValidator(offsetPaginationSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const paginationParams = c.req.valid("query");
				const result = await getShippingZones(paginationParams, activeOrgId);
				return c.json(createSuccessResponse(result));
			} catch (error) {
				return handleRouteError(c, error, "fetch shipping zones");
			}
		},
	)
	.get(
		"/shipping-zones/:id",
		authMiddleware,
		hasOrgPermission("shipping:read"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const foundShippingZone = await getShippingZone(id, activeOrgId);
				if (!foundShippingZone) {
					return c.json(
						createErrorResponse("NotFoundError", "Shipping zone not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No shipping zone found with the provided id",
							},
						]),
						404,
					);
				}
				return c.json(createSuccessResponse(foundShippingZone));
			} catch (error) {
				return handleRouteError(c, error, "fetch shipping zone");
			}
		},
	)
	.put(
		"/shipping-zones/:id",
		authMiddleware,
		hasOrgPermission("shipping:update"),
		paramValidator(idParamSchema),
		jsonValidator(updateShippingZoneSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const data = c.req.valid("json");
				const updatedShippingZone = await updateShippingZone(
					id,
					data,
					activeOrgId,
				);
				if (!updatedShippingZone) {
					return c.json(
						createErrorResponse("NotFoundError", "Shipping zone not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No shipping zone found with the provided id",
							},
						]),
						404,
					);
				}
				return c.json(createSuccessResponse(updatedShippingZone));
			} catch (error) {
				return handleRouteError(c, error, "update shipping zone");
			}
		},
	)
	.delete(
		"/shipping-zones/:id",
		authMiddleware,
		hasOrgPermission("shipping:delete"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const deletedShippingZone = await deleteShippingZone(id, activeOrgId);
				if (!deletedShippingZone) {
					return c.json(
						createErrorResponse(
							"NotFoundError",
							"Shipping zone not found or already deleted",
							[
								{
									code: "RESOURCE_NOT_FOUND",
									path: ["id"],
									message:
										"No shipping zone found with the provided id or already deleted",
								},
							],
						),
						404,
					);
				}
				return c.json(
					createSuccessResponse(
						deletedShippingZone,
						"Shipping zone deleted successfully",
					),
				);
			} catch (error) {
				return handleRouteError(c, error, "shipping zone delete");
			}
		},
	);
