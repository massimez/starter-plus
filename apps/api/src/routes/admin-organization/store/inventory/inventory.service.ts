import { and, desc, eq, ilike, inArray, isNull, sql } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/lib/db";
import {
	product,
	productVariant,
	productVariantStock,
	productVariantStockTransaction,
} from "@/lib/db/schema";
import { getAuditData } from "@/lib/utils/audit";
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

interface DbTransaction {
	select: typeof db.select;
	update: typeof db.update;
	insert: typeof db.insert;
}

// Constants
const DEFAULT_INVENTORY_LIMIT = 20;

// Custom errors
class InsufficientStockError extends Error {
	constructor(current: number, change: number) {
		super(
			`Insufficient stock. Current: ${current}, Attempted change: ${change}`,
		);
		this.name = "InsufficientStockError";
	}
}

/**
 * Get product variant stock for a specific variant
 * @param productVariantId - The ID of the product variant
 * @param orgId - The organization ID
 * @returns Stock information with quantity and reserved quantity
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
				isNull(productVariantStock.deletedAt),
			),
		)
		.limit(1);

	return stock || { quantity: 0, reservedQuantity: 0 };
}

/**
 * Create stock transaction and update stock accordingly
 * Uses a database transaction to ensure atomicity
 * @param data - Transaction data including quantity change and location
 * @param orgId - The organization ID
 * @param user - User performing the transaction
 * @returns The created transaction record
 */
export async function createStockTransaction(
	data: InsertProductVariantStockTransaction,
	orgId: string,
	user: { id: string },
) {
	return await db.transaction(async (tx) => {
		const [newTransaction] = await tx
			.insert(productVariantStockTransaction)
			.values({
				...data,
				organizationId: orgId,
				...getAuditData(user, "create"),
			})
			.returning();

		// Update productVariantStock based on this transaction
		await updateStockAfterTransaction(newTransaction, user, tx);

		return newTransaction;
	});
}

/**
 * Update product variant stock after a transaction using atomic operations
 * FIXED: Now uses atomic SQL to prevent race conditions
 * FIXED: Validates against negative stock
 * FIXED: Checks deletedAt on existing stock lookup
 * @param transaction - The stock transaction
 * @param user - User performing the update
 * @param _db - Database instance (or transaction instance)
 */
export async function updateStockAfterTransaction(
	transaction: typeof productVariantStockTransaction.$inferSelect,
	user: { id: string },
	_db: DbTransaction = db,
) {
	const { productVariantId, organizationId, locationId, quantityChange } =
		transaction;

	// FIXED: Added isNull check for deletedAt
	const [currentStock] = await _db
		.select()
		.from(productVariantStock)
		.where(
			and(
				eq(productVariantStock.productVariantId, productVariantId),
				eq(productVariantStock.organizationId, organizationId),
				eq(productVariantStock.locationId, locationId),
				isNull(productVariantStock.deletedAt),
			),
		);

	if (currentStock) {
		// FIXED: Validate against negative stock
		const newQuantity = currentStock.quantity + quantityChange;
		if (newQuantity < 0) {
			throw new InsufficientStockError(currentStock.quantity, quantityChange);
		}

		// FIXED: Use atomic SQL operation instead of read-then-update
		await _db
			.update(productVariantStock)
			.set({
				quantity: sql`${productVariantStock.quantity} + ${quantityChange}`,
				...getAuditData(user, "update"),
			})
			.where(
				and(
					eq(productVariantStock.productVariantId, productVariantId),
					eq(productVariantStock.organizationId, organizationId),
					eq(productVariantStock.locationId, locationId),
					isNull(productVariantStock.deletedAt),
				),
			);
	} else {
		// FIXED: Validate initial stock isn't negative
		if (quantityChange < 0) {
			throw new InsufficientStockError(0, quantityChange);
		}

		await _db.insert(productVariantStock).values({
			productVariantId,
			organizationId,
			locationId,
			quantity: quantityChange,
			reservedQuantity: 0,
			...getAuditData(user, "create"),
		});
	}
}

/**
 * Get stock transactions with pagination
 * @param productVariantId - Optional filter by variant ID
 * @param orgId - Organization ID
 * @param paginationParams - Limit and offset for pagination
 * @returns Paginated list of transactions with total count
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
		isNull(productVariantStockTransaction.deletedAt),
	];

	if (productVariantId) {
		filters.push(
			eq(productVariantStockTransaction.productVariantId, productVariantId),
		);
	}

	// FIXED: Simplified logic
	const whereClause = filters.length > 0 ? and(...filters) : undefined;

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

	const total = await db
		.select({ count: sql<number>`count(*)` })
		.from(productVariantStockTransaction)
		.where(whereClause)
		.then((res) => Number(res[0]?.count ?? 0));

	return { total, data };
}

/**
 * Get product variants grouped by product with inventory stock
 * @param orgId - Organization ID
 * @param params - Filter and pagination parameters
 * @param locationId - Optional location filter
 * @returns Paginated products with their variants and stock information
 */
export async function getProductVariantsGroupedByProductWithStock(
	orgId: string,
	params: GetInventoryParams = {},
	locationId?: string,
) {
	const orgIdValidated = validateOrgId(orgId);
	const {
		collectionId,
		search,
		limit = DEFAULT_INVENTORY_LIMIT,
		offset = 0,
	} = params;

	// 1. Get paginated product IDs first
	const filters = [
		eq(product.organizationId, orgIdValidated),
		isNull(product.deletedAt),
	];

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
	const total = Number(totalResult[0]?.count ?? 0);

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
	// Build stock filter conditions
	const stockFilters = [
		eq(productVariantStock.organizationId, orgIdValidated),
		isNull(productVariantStock.deletedAt),
	];
	if (locationId) {
		stockFilters.push(eq(productVariantStock.locationId, locationId));
	}

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
		.leftJoin(
			productVariant,
			and(
				eq(productVariant.productId, product.id),
				eq(productVariant.organizationId, orgIdValidated),
				isNull(productVariant.deletedAt),
			),
		)
		.leftJoin(
			productVariantStock,
			and(
				eq(productVariantStock.productVariantId, productVariant.id),
				...stockFilters,
			),
		)
		.where(inArray(product.id, pageProductIds))
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
		variants: row.variantId ? [createVariant(row)] : [],
	});

	// Group variants by product
	const productMap = new Map<string, ReturnType<typeof createProduct>>();

	for (const row of rows) {
		if (!productMap.has(row.productId)) {
			productMap.set(row.productId, createProduct(row));
		} else if (row.variantId) {
			const existing = productMap.get(row.productId);
			if (!existing?.variants.some((v) => v.id === row.variantId)) {
				existing?.variants.push(createVariant(row));
			}
		}
	}

	// Ensure we preserve the order of pageProductIds
	const orderedData = pageProductIds
		.map((id) => productMap.get(id))
		.filter((p): p is ReturnType<typeof createProduct> => p !== undefined);

	return { data: orderedData, total };
}
