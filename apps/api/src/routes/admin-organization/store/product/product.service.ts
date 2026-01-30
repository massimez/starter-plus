/** biome-ignore-all lint/style/noNonNullAssertion: <> */
import { and, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import type { z } from "zod";
import { withPaginationAndTotal } from "@/helpers/pagination";
import { db } from "@/lib/db";
import { product, productVariant, type TProductStatus } from "@/lib/db/schema";
import { getAuditData } from "@/lib/utils/audit";
import { validateOrgId } from "@/lib/utils/validator";
import type { offsetPaginationSchema } from "@/middleware/pagination";
import {
	assignProductToCollections,
	updateProductCollections,
} from "./product-collection/product-collection-assignment.service";
import type { insertProductSchema, updateProductSchema } from "./schema";

type OffsetPaginationParams = z.infer<typeof offsetPaginationSchema>;
type InsertProduct = z.infer<typeof insertProductSchema>;
type UpdateProduct = z.infer<typeof updateProductSchema>;

/**
 * Create a new product
 */
export async function createProduct(
	productData: InsertProduct,
	orgId: string,
	user: { id: string },
) {
	const {
		translations,
		images,
		thumbnailImage,
		status,
		collectionIds,
		...restData
	} = productData;
	const [newProduct] = await db
		.insert(product)
		.values({
			...restData,
			organizationId: orgId,
			status: status as TProductStatus,
			images,
			thumbnailImage,
			translations,
			...getAuditData(user, "create"),
		})
		.returning();

	// Assign product to collections if provided
	if (collectionIds && collectionIds.length > 0) {
		await assignProductToCollections(newProduct.id, collectionIds, orgId);
	}

	return newProduct;
}

/**
 * Get products with pagination
 */
export async function getProducts(
	paginationParams: OffsetPaginationParams & {
		search?: string;
		collectionId?: string;
	},
	orgId: string,
) {
	const { search, collectionId, ...basePaginationParams } = paginationParams;
	const validatedOrgId = validateOrgId(orgId);

	// Build base filters
	let productIds: string[] | undefined;

	// If filtering by collection, get product IDs from collection assignments
	if (collectionId) {
		const { productCollectionAssignment } = await import("@/lib/db/schema");
		const assignments = await db
			.select({ productId: productCollectionAssignment.productId })
			.from(productCollectionAssignment)
			.where(
				and(
					eq(productCollectionAssignment.collectionId, collectionId),
					eq(productCollectionAssignment.organizationId, validatedOrgId),
				),
			);
		productIds = assignments.map((a) => a.productId);

		// If no products in this collection, return empty result
		if (productIds.length === 0) {
			return { total: 0, data: [] };
		}
	}

	// Build filters for the query
	const filters = [];
	filters.push(eq(product.organizationId, validatedOrgId));
	filters.push(isNull(product.deletedAt));

	if (productIds && productIds.length > 0) {
		filters.push(inArray(product.id, productIds));
	}

	// Add search filter at database level
	// Search in both product.name and translations JSONB field
	if (search?.trim()) {
		const searchPattern = `%${search.trim()}%`;
		filters.push(
			or(
				ilike(product.name, searchPattern),
				sql`EXISTS (
					SELECT 1 FROM jsonb_array_elements(${product.translations}) AS t
					WHERE t->>'name' ILIKE ${searchPattern}
				)`,
			)!,
		);
	}

	const baseFilters = and(...filters);

	const result = await withPaginationAndTotal({
		db: db,
		query: null,
		table: product,
		params: basePaginationParams,
		orgId: validatedOrgId,
		baseFilters,
	});

	// Fetch variants for all products in the current page
	const resultProductIds = result.data.map((p) => p.id);

	let variants: (typeof productVariant.$inferSelect)[] = [];
	let collectionAssignments: { productId: string; collectionId: string }[] = [];

	if (resultProductIds.length > 0) {
		const variantWhereConditions = [
			inArray(productVariant.productId, resultProductIds),
			eq(productVariant.organizationId, validatedOrgId),
			isNull(productVariant.deletedAt),
		];

		variants = await db
			.select()
			.from(productVariant)
			.where(and(...variantWhereConditions));

		// Fetch collection assignments
		const { productCollectionAssignment } = await import("@/lib/db/schema");
		collectionAssignments = await db
			.select({
				productId: productCollectionAssignment.productId,
				collectionId: productCollectionAssignment.collectionId,
			})
			.from(productCollectionAssignment)
			.where(
				and(
					inArray(productCollectionAssignment.productId, resultProductIds),
					eq(productCollectionAssignment.organizationId, validatedOrgId),
				),
			);
	}

	// Map variants and collections to their respective products
	const productsWithVariants = result.data.map((p) => ({
		...p,
		variants: variants.filter((v) => v.productId === p.id),
		collectionIds: collectionAssignments
			.filter((a) => a.productId === p.id)
			.map((a) => a.collectionId),
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
				isNull(product.deletedAt),
			),
		)
		.limit(1);

	if (!foundProduct) return undefined;

	const variants = await db
		.select()
		.from(productVariant)
		.where(
			and(
				eq(productVariant.productId, productId),
				eq(productVariant.organizationId, orgId),
				isNull(productVariant.deletedAt),
			),
		);

	// Get collection assignments
	const { getProductCollections } = await import(
		"./product-collection/product-collection-assignment.service"
	);
	const collectionAssignments = await getProductCollections(productId, orgId);
	const collectionIds = collectionAssignments.map((a) => a.collectionId);

	return { ...foundProduct, variants, collectionIds };
}

/**
 * Update a product
 */
export async function updateProduct(
	productId: string,
	productData: UpdateProduct,
	orgId: string,
	user: { id: string },
) {
	const { translations, collectionIds, ...restData } = productData;

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
			...getAuditData(user, "update"),
		})
		.where(
			and(
				eq(product.id, productId),
				eq(product.organizationId, validateOrgId(orgId)),
			),
		)
		.returning();

	// Update collection assignments if provided
	if (collectionIds !== undefined) {
		await updateProductCollections(productId, collectionIds, orgId);
	}

	return updatedProduct;
}

/**
 * Delete a product
 */
export async function deleteProduct(
	productId: string,
	orgId: string,
	user: { id: string },
) {
	const [deletedProduct] = await db
		.update(product)
		.set({
			...getAuditData(user, "delete"),
		})
		.where(
			and(
				eq(product.id, productId),
				eq(product.organizationId, validateOrgId(orgId)),
			),
		)
		.returning();
	return deletedProduct;
}
