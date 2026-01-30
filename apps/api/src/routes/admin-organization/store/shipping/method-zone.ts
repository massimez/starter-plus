import { z } from "zod";
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
	createShippingMethodZone,
	deleteShippingMethodZone,
	getShippingMethodZone,
	getShippingMethodZones,
	getShippingMethodZonesByMethodId,
	getShippingMethodZonesByZoneId,
	updateShippingMethodZone,
} from "./method-zone.service";
import {
	insertShippingMethodZoneSchema,
	updateShippingMethodZoneSchema,
} from "./schema";

export const shippingMethodZoneRoute = createRouter()
	.post(
		"/shipping-method-zones",
		hasOrgPermission("shipping:create"),
		jsonValidator(insertShippingMethodZoneSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const user = c.get("user") as User;
				const data = c.req.valid("json");
				const newShippingMethodZone = await createShippingMethodZone(
					data,
					activeOrgId,
					user,
				);
				return c.json(createSuccessResponse(newShippingMethodZone), 201);
			} catch (error) {
				return handleRouteError(c, error, "create shipping method zone");
			}
		},
	)
	.get(
		"/shipping-method-zones",
		hasOrgPermission("shipping:read"),
		queryValidator(offsetPaginationSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const paginationParams = c.req.valid("query");
				const result = await getShippingMethodZones(
					paginationParams,
					activeOrgId,
				);
				return c.json(createSuccessResponse(result));
			} catch (error) {
				return handleRouteError(c, error, "fetch shipping method zones");
			}
		},
	)
	.get(
		"/shipping-methods/:methodId/zones",
		hasOrgPermission("shipping:read"),
		paramValidator(z.object({ methodId: idParamSchema.shape.id })),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { methodId } = c.req.valid("param");
				const zones = await getShippingMethodZonesByMethodId(
					methodId,
					activeOrgId,
				);
				return c.json(createSuccessResponse(zones));
			} catch (error) {
				return handleRouteError(c, error, "fetch zones for shipping method");
			}
		},
	)
	.get(
		"/shipping-zones/:zoneId/methods",
		hasOrgPermission("shipping:read"),
		paramValidator(z.object({ zoneId: idParamSchema.shape.id })),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { zoneId } = c.req.valid("param");
				const methods = await getShippingMethodZonesByZoneId(
					zoneId,
					activeOrgId,
				);
				return c.json(createSuccessResponse(methods));
			} catch (error) {
				return handleRouteError(c, error, "fetch methods for shipping zone");
			}
		},
	)
	.get(
		"/shipping-method-zones/:id",
		hasOrgPermission("shipping:read"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const foundShippingMethodZone = await getShippingMethodZone(
					id,
					activeOrgId,
				);
				if (!foundShippingMethodZone) {
					return c.json(
						createErrorResponse(
							"NotFoundError",
							"Shipping method zone not found",
							[
								{
									code: "RESOURCE_NOT_FOUND",
									path: ["id"],
									message: "No shipping method zone found with the provided id",
								},
							],
						),
						404,
					);
				}
				return c.json(createSuccessResponse(foundShippingMethodZone));
			} catch (error) {
				return handleRouteError(c, error, "fetch shipping method zone");
			}
		},
	)
	.put(
		"/shipping-method-zones/:id",
		hasOrgPermission("shipping:update"),
		paramValidator(idParamSchema),
		jsonValidator(updateShippingMethodZoneSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const user = c.get("user") as User;
				const { id } = c.req.valid("param");
				const data = c.req.valid("json");
				const updatedShippingMethodZone = await updateShippingMethodZone(
					id,
					data,
					activeOrgId,
					user,
				);
				if (!updatedShippingMethodZone) {
					return c.json(
						createErrorResponse(
							"NotFoundError",
							"Shipping method zone not found",
							[
								{
									code: "RESOURCE_NOT_FOUND",
									path: ["id"],
									message: "No shipping method zone found with the provided id",
								},
							],
						),
						404,
					);
				}
				return c.json(createSuccessResponse(updatedShippingMethodZone));
			} catch (error) {
				return handleRouteError(c, error, "update shipping method zone");
			}
		},
	)
	.delete(
		"/shipping-method-zones/:id",
		hasOrgPermission("shipping:delete"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const user = c.get("user") as User;
				const { id } = c.req.valid("param");
				const deletedShippingMethodZone = await deleteShippingMethodZone(
					id,
					activeOrgId,
					user,
				);
				if (!deletedShippingMethodZone) {
					return c.json(
						createErrorResponse(
							"NotFoundError",
							"Shipping method zone not found or already deleted",
							[
								{
									code: "RESOURCE_NOT_FOUND",
									path: ["id"],
									message:
										"No shipping method zone found with the provided id or already deleted",
								},
							],
						),
						404,
					);
				}
				return c.json(
					createSuccessResponse(
						deletedShippingMethodZone,
						"Shipping method zone deleted successfully",
					),
				);
			} catch (error) {
				return handleRouteError(c, error, "shipping method zone delete");
			}
		},
	);
