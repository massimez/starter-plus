import z from "zod";
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
import {
	createProduct,
	deleteProduct,
	getProduct,
	getProducts,
	updateProduct,
} from "./product.service";
import { insertProductSchema, updateProductSchema } from "./schema";

// --------------------
// Product Routes
// --------------------
export const productRoute = createRouter()
	.post(
		"/products",
		authMiddleware,
		hasOrgPermission("product:create"),
		jsonValidator(insertProductSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const productData = c.req.valid("json");
				const newProduct = await createProduct(productData, activeOrgId);
				return c.json(createSuccessResponse(newProduct), 201);
			} catch (error) {
				return handleRouteError(c, error, "create product");
			}
		},
	)
	.get(
		"/products",
		authMiddleware,
		hasOrgPermission("product:read"),
		queryValidator(
			offsetPaginationSchema.extend({
				languageCode: z.string().max(2).optional(),
				search: z.string().optional(),
				collectionId: z.string().optional(),
			}),
		),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const paginationParams = c.req.valid("query");

				const result = await getProducts(paginationParams, activeOrgId);

				return c.json(createSuccessResponse(result));
			} catch (error) {
				return handleRouteError(c, error, "fetch products");
			}
		},
	)
	.get(
		"/products/:id",
		authMiddleware,
		hasOrgPermission("product:read"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const foundProduct = await getProduct(id, activeOrgId);
				if (!foundProduct)
					return c.json(
						createErrorResponse("NotFoundError", "Product not found", [
							{
								code: "PRODUCT_NOT_FOUND",
								path: ["id"],
								message: "No product found with the provided id",
							},
						]),
						404,
					);

				return c.json(createSuccessResponse(foundProduct));
			} catch (error) {
				return handleRouteError(c, error, "fetch product");
			}
		},
	)
	.put(
		"/products/:id",
		authMiddleware,
		hasOrgPermission("product:update"),
		paramValidator(idParamSchema),
		jsonValidator(updateProductSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const productData = c.req.valid("json");

				const updatedProduct = await updateProduct(
					id,
					productData,
					activeOrgId,
				);
				if (!updatedProduct)
					return c.json(
						createErrorResponse("NotFoundError", "Product not found", [
							{
								code: "PRODUCT_NOT_FOUND",
								path: ["id"],
								message: "No product found with the provided id",
							},
						]),
						404,
					);
				return c.json(createSuccessResponse(updatedProduct));
			} catch (error) {
				return handleRouteError(c, error, "update product");
			}
		},
	)
	.delete(
		"/products/:id",
		authMiddleware,
		hasOrgPermission("product:delete"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const deletedProduct = await deleteProduct(id, activeOrgId);
				if (!deletedProduct)
					return c.json(
						createErrorResponse("NotFoundError", "Product not found", [
							{
								code: "PRODUCT_NOT_FOUND",
								path: ["id"],
								message: "No product found with the provided id",
							},
						]),
						404,
					);
				return c.json(
					createSuccessResponse(deletedProduct, "Product deleted successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "delete product");
			}
		},
	);
