/** biome-ignore-all lint/style/noNonNullAssertion: <> */
import { and, eq, inArray } from "drizzle-orm";
import type { z } from "zod";
import { withPaginationAndTotal } from "@/helpers/pagination";
import { db } from "@/lib/db";
import { product, productVariant, type TProductStatus } from "@/lib/db/schema";
import { validateOrgId } from "@/lib/utils/validator";
import type { offsetPaginationSchema } from "@/middleware/pagination";
import type { insertProductSchema, updateProductSchema } from "./schema";

type OffsetPaginationParams = z.infer<typeof offsetPaginationSchema>;
type InsertProduct = z.infer<typeof insertProductSchema>;
type UpdateProduct = z.infer<typeof updateProductSchema>;

/**
 * Create a new product
 */
export async function createProduct(productData: InsertProduct, orgId: string) {
	const { translations, images, thumbnailImage, status, ...restData } =
		productData;
	const [newProduct] = await db
		.insert(product)
		.values({
			...restData,
			organizationId: orgId,
			status: status as TProductStatus,
			images,
			thumbnailImage,
			translations,
		})
		.returning();
	return newProduct;
}

/**
 * Get products with pagination
 */
export async function getProducts(
	paginationParams: OffsetPaginationParams,
	orgId: string,
) {
	const result = await withPaginationAndTotal({
		db: db,
		query: null,
		table: product,
		params: paginationParams,
		orgId: validateOrgId(orgId),
	});

	// Fetch variants for all products in the current page
	const productIds = result.data.map((p) => p.id);

	let variants: (typeof productVariant.$inferSelect)[] = [];
	if (productIds.length > 0) {
		const variantWhereConditions = [
			inArray(productVariant.productId, productIds),
			eq(productVariant.organizationId, orgId),
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

	return { total: result.total, data: productsWithVariants };
}

/**
 * Get a single product by ID
 */
export async function getProduct(productId: string, orgId: string) {
	const [foundProduct] = await db
		.select()
		.from(product)
		.where(
			and(
				eq(product.id, productId),
				eq(product.organizationId, validateOrgId(orgId)),
			),
		)
		.limit(1);
	return foundProduct;
}

/**
 * Update a product
 */
export async function updateProduct(
	productId: string,
	productData: UpdateProduct,
	orgId: string,
) {
	const { translations, ...restData } = productData;

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
			...restData,
			status: restData.status as TProductStatus,
			images: restData.images,
			thumbnailImage: restData.thumbnailImage,
			translations: validTranslations,
		})
		.where(
			and(
				eq(product.id, productId),
				eq(product.organizationId, validateOrgId(orgId)),
			),
		)
		.returning();
	return updatedProduct;
}

/**
 * Delete a product
 */
export async function deleteProduct(productId: string, orgId: string) {
	const [deletedProduct] = await db
		.delete(product)
		.where(
			and(
				eq(product.id, productId),
				eq(product.organizationId, validateOrgId(orgId)),
			),
		)
		.returning();
	return deletedProduct;
}
