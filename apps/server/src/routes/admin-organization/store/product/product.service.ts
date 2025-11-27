/** biome-ignore-all lint/style/noNonNullAssertion: <> */
import { and, eq, inArray } from "drizzle-orm";
import type { z } from "zod";
import { withPaginationAndTotal } from "@/helpers/pagination";
import { db } from "@/lib/db";
import { product, productVariant, type TProductStatus } from "@/lib/db/schema";
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
export async function createProduct(productData: InsertProduct, orgId: string) {
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

	if (productIds && productIds.length > 0) {
		filters.push(inArray(product.id, productIds));
	}

	// For search, we need to filter after fetching since translations are JSONB
	// We'll fetch all matching products and then filter by search term
	const baseFilters = and(...filters);

	const result = await withPaginationAndTotal({
		db: db,
		query: null,
		table: product,
		params: basePaginationParams,
		orgId: validatedOrgId,
		baseFilters,
	});

	let filteredData = result.data;
	let total = result.total;

	// Apply search filter if provided
	if (search?.trim()) {
		const searchLower = search.toLowerCase().trim();
		filteredData = result.data.filter((p) => {
			// Search in product name
			if (p.name?.toLowerCase().includes(searchLower)) {
				return true;
			}
			// Search in translations
			if (p.translations && Array.isArray(p.translations)) {
				return p.translations.some((t: { name?: string }) =>
					t.name?.toLowerCase().includes(searchLower),
				);
			}
			return false;
		});
		total = filteredData.length;
	}

	// Fetch variants for all products in the current page
	const resultProductIds = filteredData.map((p) => p.id);

	let variants: (typeof productVariant.$inferSelect)[] = [];
	let collectionAssignments: { productId: string; collectionId: string }[] = [];

	if (resultProductIds.length > 0) {
		const variantWhereConditions = [
			inArray(productVariant.productId, resultProductIds),
			eq(productVariant.organizationId, validatedOrgId),
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
	const productsWithVariants = filteredData.map((p) => ({
		...p,
		variants: variants.filter((v) => v.productId === p.id),
		collectionIds: collectionAssignments
			.filter((a) => a.productId === p.id)
			.map((a) => a.collectionId),
	}));

	return { total, data: productsWithVariants };
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

	if (!foundProduct) return undefined;

	const variants = await db
		.select()
		.from(productVariant)
		.where(
			and(
				eq(productVariant.productId, productId),
				eq(productVariant.organizationId, orgId),
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
