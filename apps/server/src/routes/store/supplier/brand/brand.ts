import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { idAndAuditFields } from "@/helpers/constant/fields";
import { createRouter } from "@/lib/create-hono-app";
import { brand } from "@/lib/db/schema";
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
import {
	createBrand,
	deleteBrand,
	getBrand,
	getBrands,
	updateBrand,
} from "./brand.service";

const app = createRouter();

export const insertBrandSchema = createInsertSchema(brand);
export const updateBrandSchema = createSelectSchema(brand)
	.omit(idAndAuditFields)
	.partial();

export const brandRoute = app
	.post(
		"/brands",
		authMiddleware,
		hasOrgPermission("brand:create"),
		jsonValidator(insertBrandSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const data = c.req.valid("json");
				const newBrand = await createBrand(data, activeOrgId);
				return c.json(createSuccessResponse(newBrand), 201);
			} catch (error) {
				return handleRouteError(c, error, "create brand");
			}
		},
	)
	.get(
		"/brands",
		authMiddleware,
		hasOrgPermission("brand:read"),
		queryValidator(offsetPaginationSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const paginationParams = c.req.valid("query");
				const result = await getBrands(paginationParams, activeOrgId);
				return c.json(createSuccessResponse(result));
			} catch (error) {
				return handleRouteError(c, error, "fetch brands");
			}
		},
	)
	.get(
		"/brands/:id",
		authMiddleware,
		hasOrgPermission("brand:read"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const foundBrand = await getBrand(id, activeOrgId);
				if (!foundBrand) {
					return c.json(
						createErrorResponse("NotFoundError", "Brand not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No brand found with the provided id",
							},
						]),
						404,
					);
				}
				return c.json(createSuccessResponse(foundBrand));
			} catch (error) {
				return handleRouteError(c, error, "fetch brand");
			}
		},
	)
	.put(
		"/brands/:id",
		authMiddleware,
		hasOrgPermission("brand:update"),
		paramValidator(idParamSchema),
		jsonValidator(updateBrandSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const data = c.req.valid("json");
				const updatedBrand = await updateBrand(id, data, activeOrgId);
				if (!updatedBrand) {
					return c.json(
						createErrorResponse("NotFoundError", "Brand not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No brand found with the provided id",
							},
						]),
						404,
					);
				}
				return c.json(createSuccessResponse(updatedBrand));
			} catch (error) {
				return handleRouteError(c, error, "update brand");
			}
		},
	)
	.delete(
		"/brands/:id",
		authMiddleware,
		hasOrgPermission("brand:delete"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const deletedBrand = await deleteBrand(id, activeOrgId);
				if (!deletedBrand) {
					return c.json(
						createErrorResponse(
							"NotFoundError",
							"Brand not found or already deleted",
							[
								{
									code: "RESOURCE_NOT_FOUND",
									path: ["id"],
									message:
										"No brand found with the provided id or already deleted",
								},
							],
						),
						404,
					);
				}
				return c.json(
					createSuccessResponse(deletedBrand, "Brand deleted successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "brand delete");
			}
		},
	);
