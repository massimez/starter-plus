import { and, eq } from "drizzle-orm";
import { db } from "starter-db";
import { productCategory, productCategoryTranslation } from "starter-db/schema";
import z from "zod";
import { createRouter } from "@/lib/create-hono-app";
import { handleRouteError } from "@/lib/utils/route-helpers";
import {
	idParamSchema,
	jsonValidator,
	paramValidator,
	validateOrgId,
} from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import { hasOrgPermission } from "@/middleware/org-permission";
import {
	insertProductCategorySchema,
	insertProductCategoryTranslationSchema,
	updateProductCategorySchema,
	updateProductCategoryTranslationSchema,
} from "./schema";

const categoryIdParamSchema = z.object({
	categoryId: z.string().min(1, "categoryId is required"),
});

const categoryTranslationParamSchema = z.object({
	categoryId: z.string().min(1, "categoryId is required"),
	languageCode: z.string().min(1, "languageCode is required"),
});

// --------------------
// Product Category Routes
// --------------------
export const productCategoryRoute = createRouter()
	.post(
		"/product-categories",
		authMiddleware,
		hasOrgPermission("productCategory:create"),
		jsonValidator(insertProductCategorySchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const data = c.req.valid("json");
				const [newProductCategory] = await db
					.insert(productCategory)
					.values({ ...data, organizationId: activeOrgId })
					.returning();
				return c.json(newProductCategory, 201);
			} catch (error) {
				return handleRouteError(c, error, "create product category");
			}
		},
	)
	.get(
		"/product-categories",
		authMiddleware,
		hasOrgPermission("productCategory:read"),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const foundProductCategories = await db
					.select()
					.from(productCategory)
					.where(eq(productCategory.organizationId, activeOrgId));
				return c.json({ data: foundProductCategories });
			} catch (error) {
				return handleRouteError(c, error, "fetch product categories");
			}
		},
	)
	.get(
		"/product-categories/:id",
		authMiddleware,
		hasOrgPermission("productCategory:read"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const [foundProductCategory] = await db
					.select()
					.from(productCategory)
					.where(
						and(
							eq(productCategory.id, id),
							eq(productCategory.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.limit(1);
				if (!foundProductCategory)
					return c.json({ error: "Product category not found" }, 404);
				return c.json(foundProductCategory);
			} catch (error) {
				return handleRouteError(c, error, "fetch product category");
			}
		},
	)
	.put(
		"/product-categories/:id",
		authMiddleware,
		hasOrgPermission("productCategory:update"),
		paramValidator(idParamSchema),
		jsonValidator(updateProductCategorySchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const data = c.req.valid("json");
				const [updatedProductCategory] = await db
					.update(productCategory)
					.set(data)
					.where(
						and(
							eq(productCategory.id, id),
							eq(productCategory.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.returning();
				if (!updatedProductCategory)
					return c.json({ error: "Product category not found" }, 404);
				return c.json(updatedProductCategory);
			} catch (error) {
				return handleRouteError(c, error, "update product category");
			}
		},
	)
	.delete(
		"/product-categories/:id",
		authMiddleware,
		hasOrgPermission("productCategory:delete"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const [deletedProductCategory] = await db
					.delete(productCategory)
					.where(
						and(
							eq(productCategory.id, id),
							eq(productCategory.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.returning();
				if (!deletedProductCategory)
					return c.json({ error: "Product category not found" }, 404);
				return c.json({
					message: "Product category deleted successfully",
					deletedProductCategory,
				});
			} catch (error) {
				return handleRouteError(c, error, "delete product category");
			}
		},
	)
	/**
	 * ---------------------------------------------------------------------------
	 * PRODUCT CATEGORY TRANSLATION ROUTES
	 * ---------------------------------------------------------------------------
	 */
	.post(
		"/product-categories/:categoryId/translations",
		authMiddleware,
		hasOrgPermission("productCategory:create"),
		paramValidator(categoryIdParamSchema),
		jsonValidator(insertProductCategoryTranslationSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { categoryId } = c.req.valid("param");
				const data = c.req.valid("json");

				const [newTranslation] = await db
					.insert(productCategoryTranslation)
					.values({
						...data,
						organizationId: activeOrgId,
						categoryId: categoryId,
					})
					.returning();
				return c.json(newTranslation, 201);
			} catch (error) {
				return handleRouteError(
					c,
					error,
					"create product category translation",
				);
			}
		},
	)
	.get(
		"/product-categories/:categoryId/translations",
		authMiddleware,
		hasOrgPermission("productCategory:read"),
		paramValidator(categoryIdParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { categoryId } = c.req.valid("param");

				const foundTranslations = await db
					.select()
					.from(productCategoryTranslation)
					.where(
						and(
							eq(productCategoryTranslation.categoryId, categoryId),
							eq(
								productCategoryTranslation.organizationId,
								validateOrgId(activeOrgId),
							),
						),
					);
				return c.json({ data: foundTranslations });
			} catch (error) {
				return handleRouteError(
					c,
					error,
					"fetch product category translations",
				);
			}
		},
	)
	.get(
		"/product-categories/:categoryId/translations/:languageCode",
		authMiddleware,
		hasOrgPermission("productCategory:read"),
		paramValidator(categoryTranslationParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { categoryId, languageCode } = c.req.valid("param");

				const [foundTranslation] = await db
					.select()
					.from(productCategoryTranslation)
					.where(
						and(
							eq(productCategoryTranslation.categoryId, categoryId),
							eq(productCategoryTranslation.languageCode, languageCode),
							eq(
								productCategoryTranslation.organizationId,
								validateOrgId(activeOrgId),
							),
						),
					)
					.limit(1);
				if (!foundTranslation)
					return c.json(
						{ error: "Product category translation not found" },
						404,
					);
				return c.json(foundTranslation);
			} catch (error) {
				return handleRouteError(c, error, "fetch product category translation");
			}
		},
	)
	.put(
		"/product-categories/:categoryId/translations/:languageCode",
		authMiddleware,
		hasOrgPermission("productCategory:update"),
		paramValidator(categoryTranslationParamSchema),
		jsonValidator(updateProductCategoryTranslationSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { categoryId, languageCode } = c.req.valid("param");
				const data = c.req.valid("json");

				const [updatedTranslation] = await db
					.update(productCategoryTranslation)
					.set(data)
					.where(
						and(
							eq(productCategoryTranslation.categoryId, categoryId),
							eq(productCategoryTranslation.languageCode, languageCode),
							eq(
								productCategoryTranslation.organizationId,
								validateOrgId(activeOrgId),
							),
						),
					)
					.returning();
				if (!updatedTranslation)
					return c.json(
						{ error: "Product category translation not found" },
						404,
					);
				return c.json(updatedTranslation);
			} catch (error) {
				return handleRouteError(
					c,
					error,
					"update product category translation",
				);
			}
		},
	)
	.delete(
		"/product-categories/:categoryId/translations/:languageCode",
		authMiddleware,
		hasOrgPermission("productCategory:delete"),
		paramValidator(categoryTranslationParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { categoryId, languageCode } = c.req.valid("param");

				const [deletedTranslation] = await db
					.delete(productCategoryTranslation)
					.where(
						and(
							eq(productCategoryTranslation.categoryId, categoryId),
							eq(productCategoryTranslation.languageCode, languageCode),
							eq(
								productCategoryTranslation.organizationId,
								validateOrgId(activeOrgId),
							),
						),
					)
					.returning();
				if (!deletedTranslation)
					return c.json(
						{ error: "Product category translation not found" },
						404,
					);
				return c.json({
					message: "Product category translation deleted successfully",
					deletedTranslation,
				});
			} catch (error) {
				return handleRouteError(
					c,
					error,
					"delete product category translation",
				);
			}
		},
	);
