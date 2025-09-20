// --------------------
// Product Variant Routes

import { and, eq } from "drizzle-orm";
import { db } from "starter-db";
import { productVariant, productVariantTranslation } from "starter-db/schema";
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
	insertProductVariantSchema,
	insertProductVariantTranslationSchema,
	updateProductVariantSchema,
	updateProductVariantTranslationSchema,
} from "./schema";

const productVariantIdParamSchema = z.object({
	productVariantId: z.string().min(1, "productVariantId is required"),
});

const productVariantTranslationParamSchema = z.object({
	productVariantId: z.string().min(1, "productVariantId is required"),
	languageCode: z.string().min(1, "languageCode is required"),
});

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
				const [newProductVariant] = await db
					.insert(productVariant)
					.values({
						...data,
						organizationId: activeOrgId,
					} as z.infer<typeof insertProductVariantSchema>)
					.returning();
				return c.json(newProductVariant, 201);
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
				const foundProductVariants = await db
					.select()
					.from(productVariant)
					.where(eq(productVariant.organizationId, activeOrgId));
				return c.json({ data: foundProductVariants });
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
				const [foundProductVariant] = await db
					.select()
					.from(productVariant)
					.where(
						and(
							eq(productVariant.id, id),
							eq(productVariant.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.limit(1);
				if (!foundProductVariant)
					return c.json({ error: "Product variant not found" }, 404);
				return c.json(foundProductVariant);
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
				const [updatedProductVariant] = await db
					.update(productVariant)
					.set(data)
					.where(
						and(
							eq(productVariant.id, id),
							eq(productVariant.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.returning();
				if (!updatedProductVariant)
					return c.json({ error: "Product variant not found" }, 404);
				return c.json(updatedProductVariant);
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
				const [deletedProductVariant] = await db
					.delete(productVariant)
					.where(
						and(
							eq(productVariant.id, id),
							eq(productVariant.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.returning();
				if (!deletedProductVariant)
					return c.json({ error: "Product variant not found" }, 404);
				return c.json({
					message: "Product variant deleted successfully",
					deletedProductVariant,
				});
			} catch (error) {
				return handleRouteError(c, error, "delete product variant");
			}
		},
	)
	/**
	 * ---------------------------------------------------------------------------
	 * PRODUCT VARIANT TRANSLATION ROUTES
	 * ---------------------------------------------------------------------------
	 */
	.post(
		"/product-variants/:productVariantId/translations",
		authMiddleware,
		hasOrgPermission("productVariant:create"),
		paramValidator(productVariantIdParamSchema),
		jsonValidator(insertProductVariantTranslationSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { productVariantId } = c.req.valid("param");
				const data = c.req.valid("json");

				const [newTranslation] = await db
					.insert(productVariantTranslation)
					.values({
						...data,
						organizationId: activeOrgId,
						productVariantId: productVariantId,
					})
					.returning();
				return c.json(newTranslation, 201);
			} catch (error) {
				return handleRouteError(c, error, "create product variant translation");
			}
		},
	)
	.get(
		"/product-variants/:productVariantId/translations",
		authMiddleware,
		hasOrgPermission("productVariant:read"),
		paramValidator(productVariantIdParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { productVariantId } = c.req.valid("param");

				const foundTranslations = await db
					.select()
					.from(productVariantTranslation)
					.where(
						and(
							eq(productVariantTranslation.productVariantId, productVariantId),
							eq(
								productVariantTranslation.organizationId,
								validateOrgId(activeOrgId),
							),
						),
					);
				return c.json({ data: foundTranslations });
			} catch (error) {
				return handleRouteError(c, error, "fetch product variant translations");
			}
		},
	)
	.get(
		"/product-variants/:productVariantId/translations/:languageCode",
		authMiddleware,
		hasOrgPermission("productVariant:read"),
		paramValidator(productVariantTranslationParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { productVariantId, languageCode } = c.req.valid("param");

				const [foundTranslation] = await db
					.select()
					.from(productVariantTranslation)
					.where(
						and(
							eq(productVariantTranslation.productVariantId, productVariantId),
							eq(productVariantTranslation.languageCode, languageCode),
							eq(
								productVariantTranslation.organizationId,
								validateOrgId(activeOrgId),
							),
						),
					)
					.limit(1);
				if (!foundTranslation)
					return c.json(
						{ error: "Product variant translation not found" },
						404,
					);
				return c.json(foundTranslation);
			} catch (error) {
				return handleRouteError(c, error, "fetch product variant translation");
			}
		},
	)
	.put(
		"/product-variants/:productVariantId/translations/:languageCode",
		authMiddleware,
		hasOrgPermission("productVariant:update"),
		paramValidator(productVariantTranslationParamSchema),
		jsonValidator(updateProductVariantTranslationSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { productVariantId, languageCode } = c.req.valid("param");
				const data = c.req.valid("json");

				const [updatedTranslation] = await db
					.update(productVariantTranslation)
					.set(data)
					.where(
						and(
							eq(productVariantTranslation.productVariantId, productVariantId),
							eq(productVariantTranslation.languageCode, languageCode),
							eq(
								productVariantTranslation.organizationId,
								validateOrgId(activeOrgId),
							),
						),
					)
					.returning();
				if (!updatedTranslation)
					return c.json(
						{ error: "Product variant translation not found" },
						404,
					);
				return c.json(updatedTranslation);
			} catch (error) {
				return handleRouteError(c, error, "update product variant translation");
			}
		},
	)
	.delete(
		"/product-variants/:productVariantId/translations/:languageCode",
		authMiddleware,
		hasOrgPermission("productVariant:delete"),
		paramValidator(productVariantTranslationParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { productVariantId, languageCode } = c.req.valid("param");

				const [deletedTranslation] = await db
					.delete(productVariantTranslation)
					.where(
						and(
							eq(productVariantTranslation.productVariantId, productVariantId),
							eq(productVariantTranslation.languageCode, languageCode),
							eq(
								productVariantTranslation.organizationId,
								validateOrgId(activeOrgId),
							),
						),
					)
					.returning();
				if (!deletedTranslation)
					return c.json(
						{ error: "Product variant translation not found" },
						404,
					);
				return c.json({
					message: "Product variant translation deleted successfully",
					deletedTranslation,
				});
			} catch (error) {
				return handleRouteError(c, error, "delete product variant translation");
			}
		},
	);
