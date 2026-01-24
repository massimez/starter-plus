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
	insertProductCollectionSchema,
	updateProductCollectionSchema,
} from "../schema";
import {
	createProductCollection,
	deleteProductCollection,
	getProductCollection,
	getProductCollections,
	updateProductCollection,
} from "./product-collection.service";

export const productCollectionRoute = createRouter()
	.post(
		"/product-collections",
		authMiddleware,
		hasOrgPermission("productCollection:create"),
		jsonValidator(insertProductCollectionSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const data = c.req.valid("json");
				const newProductCollection = await createProductCollection(
					data,
					activeOrgId,
				);
				return c.json(createSuccessResponse(newProductCollection), 201);
			} catch (error) {
				return handleRouteError(c, error, "create product collection");
			}
		},
	)
	.get(
		"/product-collections",
		authMiddleware,
		hasOrgPermission("productCollection:read"),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const foundProductCollections =
					await getProductCollections(activeOrgId);
				return c.json(createSuccessResponse(foundProductCollections));
			} catch (error) {
				return handleRouteError(c, error, "fetch product collections");
			}
		},
	)
	.get(
		"/product-collections/:id",
		authMiddleware,
		hasOrgPermission("productCollection:read"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const foundProductCollection = await getProductCollection(
					id,
					activeOrgId,
				);
				if (!foundProductCollection) {
					return c.json(
						createErrorResponse(
							"NotFoundError",
							"Product collection not found",
							[
								{
									code: "RESOURCE_NOT_FOUND",
									path: ["id"],
									message: "No product collection found with the provided id",
								},
							],
						),
						404,
					);
				}
				return c.json(createSuccessResponse(foundProductCollection));
			} catch (error) {
				return handleRouteError(c, error, "fetch product collection");
			}
		},
	)
	.put(
		"/product-collections/:id",
		authMiddleware,
		hasOrgPermission("productCollection:update"),
		paramValidator(idParamSchema),
		jsonValidator(updateProductCollectionSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const data = c.req.valid("json");
				const updatedProductCollection = await updateProductCollection(
					id,
					data,
					activeOrgId,
				);
				if (!updatedProductCollection) {
					return c.json(
						createErrorResponse(
							"NotFoundError",
							"Product collection not found",
							[
								{
									code: "RESOURCE_NOT_FOUND",
									path: ["id"],
									message: "No product collection found with the provided id",
								},
							],
						),
						404,
					);
				}
				return c.json(createSuccessResponse(updatedProductCollection));
			} catch (error) {
				return handleRouteError(c, error, "update product collection");
			}
		},
	)
	.delete(
		"/product-collections/:id",
		authMiddleware,
		hasOrgPermission("productCollection:delete"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const deletedProductCollection = await deleteProductCollection(
					id,
					activeOrgId,
				);
				if (!deletedProductCollection) {
					return c.json(
						createErrorResponse(
							"NotFoundError",
							"Product collection not found",
							[
								{
									code: "RESOURCE_NOT_FOUND",
									path: ["id"],
									message: "No product collection found with the provided id",
								},
							],
						),
						404,
					);
				}
				return c.json(
					createSuccessResponse(
						deletedProductCollection,
						"Product collection deleted successfully",
					),
				);
			} catch (error) {
				return handleRouteError(c, error, "delete product collection");
			}
		},
	);
