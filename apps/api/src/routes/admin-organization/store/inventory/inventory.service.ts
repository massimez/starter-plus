import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/lib/db";
import {
	product,
	productVariant,
	productVariantStock,
	productVariantStockTransaction,
} from "@/lib/db/schema";
import { validateOrgId } from "@/lib/utils/validator";
import type { OffsetPaginationParams } from "@/types/api";
import type { insertProductVariantStockTransactionSchema } from "./schema";

type InsertProductVariantStockTransaction = z.infer<
	typeof insertProductVariantStockTransactionSchema
>;

interface GetInventoryParams {
	collectionId?: string;
	search?: string;
	limit?: number;
	offset?: number;
}

/**
 * Get product variant stock
 */
export async function getProductVariantStock(
	productVariantId: string,
	orgId: string,
) {
	const [stock] = await db
		.select()
		.from(productVariantStock)
		.where(
			and(
				eq(productVariantStock.productVariantId, productVariantId),
				eq(productVariantStock.organizationId, validateOrgId(orgId)),
			),
		)
		.limit(1);

	return stock || { quantity: 0, reservedQuantity: 0 };
}

/**
 * Create stock transaction and update stock accordingly
 */
export async function createStockTransaction(
	data: InsertProductVariantStockTransaction,
	orgId: string,
) {
	return await db.transaction(async (tx) => {
		const [newTransaction] = await tx
			.insert(productVariantStockTransaction)
			.values({
				...data,
				organizationId: orgId,
			})
			.returning();

		// Update productVariantStock based on this transaction
		await updateStockAfterTransaction(newTransaction, tx);

		return newTransaction;
	});
}

/**
 * Update product variant stock after a transaction
 */
export async function updateStockAfterTransaction(
	transaction: typeof productVariantStockTransaction.$inferSelect,
	_db: Pick<typeof db, "select" | "update" | "insert"> = db,
) {
	const { productVariantId, organizationId, locationId, quantityChange } =
		transaction;

	const [currentStock] = await _db
		.select()
		.from(productVariantStock)
		.where(
			and(
				eq(productVariantStock.productVariantId, productVariantId),
				eq(productVariantStock.organizationId, organizationId),
				eq(productVariantStock.locationId, locationId),
			),
		);

	if (currentStock) {
		await _db
			.update(productVariantStock)
			.set({ quantity: currentStock.quantity + quantityChange })
			.where(
				and(
					eq(productVariantStock.productVariantId, productVariantId),
					eq(productVariantStock.organizationId, organizationId),
					eq(productVariantStock.locationId, locationId),
				),
			);
	} else {
		await _db.insert(productVariantStock).values({
			productVariantId,
			organizationId,
			locationId,
			quantity: quantityChange,
			reservedQuantity: 0, // Assuming new stock starts with 0 reserved
		});
	}
}

/**
 * Get stock transactions with pagination
 */
export async function getStockTransactions(
	productVariantId: string | undefined,
	orgId: string,
	paginationParams: OffsetPaginationParams,
) {
	const { limit, offset } = paginationParams;
	const validatedOrgId = validateOrgId(orgId);

	const filters = [
		eq(productVariantStockTransaction.organizationId, validatedOrgId),
	];

	if (productVariantId) {
		filters.push(
			eq(productVariantStockTransaction.productVariantId, productVariantId),
		);
	}

	const whereClause =
		filters.length > 1
			? and(...filters)
			: filters.length === 1
				? filters[0]
				: undefined;

	const data = await db.query.productVariantStockTransaction.findMany({
		where: whereClause,
		with: {
			location: true,
			variant: true,
		},
		limit,
		offset,
		orderBy: (tx, { desc }) => [desc(tx.createdAt)],
	});

	// optional: total count if you need pagination info
	const total = await db
		.select({ count: sql<number>`count(*)` })
		.from(productVariantStockTransaction)
		.where(whereClause)
		.then((res) => res[0]?.count ?? 0);

	return { total, data };
}

/**
 * Get product variants grouped by product with inventory stock
 */
export async function getProductVariantsGroupedByProductWithStock(
	orgId: string,
	params: GetInventoryParams = {},
	locationId?: string,
) {
	const orgIdValidated = validateOrgId(orgId);
	const { collectionId, search, limit = 20, offset = 0 } = params;

	// 1. Get paginated product IDs first
	const filters = [eq(product.organizationId, orgIdValidated)];

	if (collectionId) {
		const { productCollectionAssignment } = await import("@/lib/db/schema");
		const assignments = await db
			.select({ productId: productCollectionAssignment.productId })
			.from(productCollectionAssignment)
			.where(
				and(
					eq(productCollectionAssignment.collectionId, collectionId),
					eq(productCollectionAssignment.organizationId, orgIdValidated),
				),
			);
		const productIdsInCollection = assignments.map((a) => a.productId);

		if (productIdsInCollection.length === 0) {
			return { data: [], total: 0 };
		}

		filters.push(inArray(product.id, productIdsInCollection));
	}

	if (search?.trim()) {
		const searchPattern = `%${search.trim()}%`;
		filters.push(ilike(product.name, searchPattern));
	}

	const whereClause = and(...filters);

	// Get total count
	const totalResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(product)
		.where(whereClause);
	const total = Number(totalResult[0]?.count || 0);

	// Get paginated product IDs
	const productIdsResult = await db
		.select({ id: product.id })
		.from(product)
		.where(whereClause)
		.limit(limit)
		.offset(offset)
		.orderBy(desc(product.createdAt));

	const pageProductIds = productIdsResult.map((p) => p.id);

	if (pageProductIds.length === 0) {
		return { data: [], total };
	}

	// 2. Fetch full details for these products
	const rows = await db
		.select({
			productId: product.id,
			productName: product.name,
			productTranslations: product.translations,
			variantId: productVariant.id,
			variantSku: productVariant.sku,
			variantPrice: productVariant.price,
			variantTranslations: productVariant.translations,
			totalQuantity:
				sql<number>`COALESCE(SUM(${productVariantStock.quantity}), 0)`.as(
					"total_quantity",
				),
			totalReservedQuantity:
				sql<number>`COALESCE(SUM(${productVariantStock.reservedQuantity}), 0)`.as(
					"total_reserved",
				),
		})
		.from(product)
		.innerJoin(productVariant, eq(productVariant.productId, product.id))
		.leftJoin(
			productVariantStock,
			and(
				eq(productVariantStock.productVariantId, productVariant.id),
				eq(productVariantStock.organizationId, orgIdValidated),
				locationId ? eq(productVariantStock.locationId, locationId) : undefined,
			),
		)
		.where(
			and(
				inArray(product.id, pageProductIds),
				eq(product.organizationId, orgIdValidated),
				eq(productVariant.organizationId, orgIdValidated),
				locationId ? eq(productVariantStock.locationId, locationId) : undefined,
			),
		)
		.groupBy(
			product.id,
			product.name,
			product.translations,
			productVariant.id,
			productVariant.sku,
			productVariant.price,
			productVariant.translations,
		)
		.orderBy(desc(product.createdAt), desc(productVariant.createdAt));

	type Row = (typeof rows)[0];

	const createVariant = (row: Row) => ({
		id: row.variantId,
		sku: row.variantSku,
		price: row.variantPrice ? Number(row.variantPrice) : undefined,
		translations: row.variantTranslations,
		stock: {
			quantity: Number(row.totalQuantity),
			reservedQuantity: Number(row.totalReservedQuantity),
		},
	});

	const createProduct = (row: Row) => ({
		id: row.productId,
		name: row.productName,
		translations: row.productTranslations,
		variants: [createVariant(row)],
	});

	const productMap = new Map(
		rows.map((row) => [row.productId, createProduct(row)]),
	);

	rows.forEach((row) => {
		const existing = productMap.get(row.productId);
		if (existing && existing.variants[0].id !== row.variantId) {
			existing.variants.push(createVariant(row));
		}
	});

	// Ensure we preserve the order of pageProductIds
	const orderedData = pageProductIds
		.map((id) => productMap.get(id))
		.filter((p): p is ReturnType<typeof createProduct> => p !== undefined);

	return { data: orderedData, total };
}
