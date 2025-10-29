// --------------------
// Product Variant Routes
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
} from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import { hasOrgPermission } from "@/middleware/org-permission";
import {
	insertProductVariantSchema,
	updateProductVariantSchema,
} from "../schema";
import {
	createProductVariant,
	deleteProductVariant,
	getProductVariant,
	getProductVariants,
	updateProductVariant,
} from "./product-variant.service";

// --------------------
export const productVariantRoute = createRouter()
	.post(
		"/product-variants",
		authMiddleware,
		hasOrgPermission("productVariant:create"),
		jsonValidator(insertProductVariantSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const data = c.req.valid("json");
				const newProductVariant = await createProductVariant(data, activeOrgId);
				return c.json(createSuccessResponse(newProductVariant), 201);
			} catch (error) {
				return handleRouteError(c, error, "create product variant");
			}
		},
	)
	.get(
		"/product-variants",
		authMiddleware,
		hasOrgPermission("productVariant:read"),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const foundProductVariants = await getProductVariants(activeOrgId);
				return c.json(createSuccessResponse(foundProductVariants));
			} catch (error) {
				return handleRouteError(c, error, "fetch product variants");
			}
		},
	)
	.get(
		"/product-variants/:id",
		authMiddleware,
		hasOrgPermission("productVariant:read"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const foundProductVariant = await getProductVariant(id, activeOrgId);
				if (!foundProductVariant) {
					return c.json(
						createErrorResponse("NotFoundError", "Product variant not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No product variant found with the provided id",
							},
						]),
						404,
					);
				}
				return c.json(createSuccessResponse(foundProductVariant));
			} catch (error) {
				return handleRouteError(c, error, "fetch product variant");
			}
		},
	)
	.put(
		"/product-variants/:id",
		authMiddleware,
		hasOrgPermission("productVariant:update"),
		paramValidator(idParamSchema),
		jsonValidator(updateProductVariantSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const data = c.req.valid("json");
				const updatedProductVariant = await updateProductVariant(
					id,
					data,
					activeOrgId,
				);
				if (!updatedProductVariant) {
					return c.json(
						createErrorResponse("NotFoundError", "Product variant not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No product variant found with the provided id",
							},
						]),
						404,
					);
				}
				return c.json(createSuccessResponse(updatedProductVariant));
			} catch (error) {
				return handleRouteError(c, error, "update product variant");
			}
		},
	)
	.delete(
		"/product-variants/:id",
		authMiddleware,
		hasOrgPermission("productVariant:delete"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const deletedProductVariant = await deleteProductVariant(
					id,
					activeOrgId,
				);
				if (!deletedProductVariant) {
					return c.json(
						createErrorResponse("NotFoundError", "Product variant not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No product variant found with the provided id",
							},
						]),
						404,
					);
				}
				return c.json(
					createSuccessResponse(
						deletedProductVariant,
						"Product variant deleted successfully",
					),
				);
			} catch (error) {
				return handleRouteError(c, error, "delete product variant");
			}
		},
	);
