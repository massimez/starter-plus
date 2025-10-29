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
import { insertSupplierSchema, updateSupplierSchema } from "./schema";
import {
	createSupplier,
	deleteSupplier,
	getSupplier,
	getSuppliers,
	updateSupplier,
} from "./supplier.service";

export const supplierRoute = createRouter()
	.post(
		"/suppliers",
		authMiddleware,
		hasOrgPermission("supplier:create"),
		jsonValidator(insertSupplierSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const data = c.req.valid("json");
				const newSupplier = await createSupplier(data, activeOrgId);
				return c.json(createSuccessResponse(newSupplier), 201);
			} catch (error) {
				return handleRouteError(c, error, "create supplier");
			}
		},
	)
	.get(
		"/suppliers",
		authMiddleware,
		hasOrgPermission("supplier:read"),
		queryValidator(offsetPaginationSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const paginationParams = c.req.valid("query");
				const result = await getSuppliers(paginationParams, activeOrgId);
				return c.json(createSuccessResponse(result));
			} catch (error) {
				return handleRouteError(c, error, "fetch suppliers");
			}
		},
	)
	.get(
		"/suppliers/:id",
		authMiddleware,
		hasOrgPermission("supplier:read"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const foundSupplier = await getSupplier(id, activeOrgId);
				if (!foundSupplier) {
					return c.json(
						createErrorResponse("NotFoundError", "Supplier not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No supplier found with the provided id",
							},
						]),
						404,
					);
				}
				return c.json(createSuccessResponse(foundSupplier));
			} catch (error) {
				return handleRouteError(c, error, "fetch supplier");
			}
		},
	)
	.put(
		"/suppliers/:id",
		authMiddleware,
		hasOrgPermission("supplier:update"),
		paramValidator(idParamSchema),
		jsonValidator(updateSupplierSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const data = c.req.valid("json");
				const updatedSupplier = await updateSupplier(id, data, activeOrgId);
				if (!updatedSupplier) {
					return c.json(
						createErrorResponse("NotFoundError", "Supplier not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No supplier found with the provided id",
							},
						]),
						404,
					);
				}
				return c.json(createSuccessResponse(updatedSupplier));
			} catch (error) {
				return handleRouteError(c, error, "update supplier");
			}
		},
	)
	.delete(
		"/suppliers/:id",
		authMiddleware,
		hasOrgPermission("supplier:delete"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const deletedSupplier = await deleteSupplier(id, activeOrgId);
				if (!deletedSupplier) {
					return c.json(
						createErrorResponse(
							"NotFoundError",
							"Supplier not found or already deleted",
							[
								{
									code: "RESOURCE_NOT_FOUND",
									path: ["id"],
									message:
										"No supplier found with the provided id or already deleted",
								},
							],
						),
						404,
					);
				}
				return c.json(
					createSuccessResponse(
						deletedSupplier,
						"Supplier deleted successfully",
					),
				);
			} catch (error) {
				return handleRouteError(c, error, "supplier delete");
			}
		},
	);
