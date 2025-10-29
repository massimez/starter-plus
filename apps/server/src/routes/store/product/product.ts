import { and, eq, inArray, sql } from "drizzle-orm";
import { withPaginationAndTotal } from "@/helpers/pagination";
import { createRouter } from "@/lib/create-hono-app";
import { db } from "@/lib/db";
import { product, productVariant, type TProductStatus } from "@/lib/db/schema";
import { handleRouteError } from "@/lib/utils/route-helpers";
import {
	idParamSchema,
	jsonValidator,
	paramValidator,
	queryValidator,
	validateOrgId,
} from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import { createErrorResponse } from "@/middleware/error-handler";
import { hasOrgPermission } from "@/middleware/org-permission";
import {
	languageCodeSchema,
	offsetPaginationSchema,
} from "@/middleware/pagination";
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
				const { translations, images, thumbnailImage, ...productData } =
					c.req.valid("json");
				const [newProduct] = await db
					.insert(product)
					.values({
						...productData,
						organizationId: activeOrgId,
						status: productData.status as TProductStatus,
						images: images,
						thumbnailImage: thumbnailImage,
						translations: translations,
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
		queryValidator(languageCodeSchema),
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

				// Fetch variants for all products in the current page
				const productIds = result.data.map((p) => p.id);

				let variants: (typeof productVariant.$inferSelect)[] = [];
				if (productIds.length > 0) {
					const variantWhereConditions = [
						inArray(productVariant.productId, productIds),
						eq(productVariant.organizationId, activeOrgId),
					];

					variants = await db
						.select()
						.from(productVariant)
						.where(and(...variantWhereConditions));
				}

				// Map variants to their respective products
				const productsWithVariants = result.data.map((p) => ({
					...p,
					variants: variants.filter((v) => v.productId === p.id),
				}));

				return c.json({
					total: result.total,
					data: productsWithVariants,
				});
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
				const { translations, ...productData } = c.req.valid("json");

				const validTranslations = translations
					?.filter((t) => t.languageCode && t.name && t.slug)
					.map((t) => ({
						languageCode: t.languageCode!,
						name: t.name!,
						slug: t.slug!,
						shortDescription: t.shortDescription,
						description: t.description,
						brandName: t.brandName,
						seoTitle: t.seoTitle,
						seoDescription: t.seoDescription,
						tags: t.tags,
					}));

				const [updatedProduct] = await db
					.update(product)
					.set({
						...productData,
						status: productData.status as TProductStatus,
						images: productData.images,
						thumbnailImage: productData.thumbnailImage,
						translations: validTranslations,
					})
					.where(
						and(
							eq(product.id, id),
							eq(product.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.returning();
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
				return c.json({
					message: "Product deleted successfully",
					deletedProduct,
				});
			} catch (error) {
				return handleRouteError(c, error, "delete product");
			}
		},
	);
