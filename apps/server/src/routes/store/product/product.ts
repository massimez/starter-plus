import { and, eq } from "drizzle-orm";
import { db } from "starter-db";
import { product, productTranslation } from "starter-db/schema";
import z from "zod";
import { withPaginationAndTotal } from "@/helpers/pagination";
import { createRouter } from "@/lib/create-hono-app";
import { handleRouteError } from "@/lib/utils/route-helpers";
import {
	idParamSchema,
	jsonValidator,
	paramValidator,
	queryValidator,
	validateOrgId,
} from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import { hasOrgPermission } from "@/middleware/org-permission";
import { offsetPaginationSchema } from "@/middleware/pagination";
import {
	insertProductSchema,
	insertProductTranslationSchema,
	updateProductSchema,
	updateProductTranslationSchema,
} from "./schema";

const productIdParamSchema = z.object({
	productId: z.string().min(1, "productId is required"),
});

const productTranslationParamSchema = z.object({
	productId: z.string().min(1, "productId is required"),
	languageCode: z.string().min(1, "languageCode is required"),
});

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
				const data = c.req.valid("json");
				const [newProduct] = await db
					.insert(product)
					.values({
						...data,
						organizationId: activeOrgId,
						status: data.status as any,
					})
					.returning();
				return c.json(newProduct, 201);
			} catch (error) {
				return handleRouteError(c, error, "create product");
			}
		},
	)
	.get(
		"/products",
		authMiddleware,
		hasOrgPermission("product:read"),
		queryValidator(offsetPaginationSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const paginationParams = c.req.valid("query");

				const result = await withPaginationAndTotal({
					db: db,
					query: null,
					table: product,
					params: paginationParams,
					orgId: activeOrgId,
				});

				return c.json({ total: result.total, data: result.data });
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
				const [foundProduct] = await db
					.select()
					.from(product)
					.where(
						and(
							eq(product.id, id),
							eq(product.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.limit(1);
				if (!foundProduct) return c.json({ error: "Product not found" }, 404);
				return c.json(foundProduct);
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
				const data = c.req.valid("json");
				const [updatedProduct] = await db
					.update(product)
					.set({
						...data,
						status: data.status as any,
					})
					.where(
						and(
							eq(product.id, id),
							eq(product.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.returning();
				if (!updatedProduct) return c.json({ error: "Product not found" }, 404);
				return c.json(updatedProduct);
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
				const [deletedProduct] = await db
					.delete(product)
					.where(
						and(
							eq(product.id, id),
							eq(product.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.returning();
				if (!deletedProduct) return c.json({ error: "Product not found" }, 404);
				return c.json({
					message: "Product deleted successfully",
					deletedProduct,
				});
			} catch (error) {
				return handleRouteError(c, error, "delete product");
			}
		},
	)
	/**
	 * ---------------------------------------------------------------------------
	 * PRODUCT TRANSLATION ROUTES
	 * ---------------------------------------------------------------------------
	 */
	.post(
		"/products/:productId/translations",
		authMiddleware,
		hasOrgPermission("product:create"),
		paramValidator(productIdParamSchema),
		jsonValidator(insertProductTranslationSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { productId } = c.req.valid("param");
				const data = c.req.valid("json");

				const [newTranslation] = await db
					.insert(productTranslation)
					.values({
						...data,
						organizationId: activeOrgId,
						productId: productId,
					})
					.returning();
				return c.json(newTranslation, 201);
			} catch (error) {
				return handleRouteError(c, error, "create product translation");
			}
		},
	)
	.get(
		"/products/:productId/translations",
		authMiddleware,
		hasOrgPermission("product:read"),
		paramValidator(productIdParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { productId } = c.req.valid("param");

				const foundTranslations = await db
					.select()
					.from(productTranslation)
					.where(
						and(
							eq(productTranslation.productId, productId),
							eq(productTranslation.organizationId, validateOrgId(activeOrgId)),
						),
					);
				return c.json({ data: foundTranslations });
			} catch (error) {
				return handleRouteError(c, error, "fetch product translations");
			}
		},
	)
	.get(
		"/products/:productId/translations/:languageCode",
		authMiddleware,
		hasOrgPermission("product:read"),
		paramValidator(productTranslationParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { productId, languageCode } = c.req.valid("param");

				const [foundTranslation] = await db
					.select()
					.from(productTranslation)
					.where(
						and(
							eq(productTranslation.productId, productId),
							eq(productTranslation.languageCode, languageCode),
							eq(productTranslation.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.limit(1);
				if (!foundTranslation)
					return c.json({ error: "Product translation not found" }, 404);
				return c.json(foundTranslation);
			} catch (error) {
				return handleRouteError(c, error, "fetch product translation");
			}
		},
	)
	.put(
		"/products/:productId/translations/:languageCode",
		authMiddleware,
		hasOrgPermission("product:update"),
		paramValidator(productTranslationParamSchema),
		jsonValidator(updateProductTranslationSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { productId, languageCode } = c.req.valid("param");
				const data = c.req.valid("json");

				const [updatedTranslation] = await db
					.update(productTranslation)
					.set(data)
					.where(
						and(
							eq(productTranslation.productId, productId),
							eq(productTranslation.languageCode, languageCode),
							eq(productTranslation.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.returning();
				if (!updatedTranslation)
					return c.json({ error: "Product translation not found" }, 404);
				return c.json(updatedTranslation);
			} catch (error) {
				return handleRouteError(c, error, "update product translation");
			}
		},
	)
	.delete(
		"/products/:productId/translations/:languageCode",
		authMiddleware,
		hasOrgPermission("product:delete"),
		paramValidator(productTranslationParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { productId, languageCode } = c.req.valid("param");

				const [deletedTranslation] = await db
					.delete(productTranslation)
					.where(
						and(
							eq(productTranslation.productId, productId),
							eq(productTranslation.languageCode, languageCode),
							eq(productTranslation.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.returning();
				if (!deletedTranslation)
					return c.json({ error: "Product translation not found" }, 404);
				return c.json({
					message: "Product translation deleted successfully",
					deletedTranslation,
				});
			} catch (error) {
				return handleRouteError(c, error, "delete product translation");
			}
		},
	);
