import {
	and,
	asc,
	desc,
	eq,
	gte,
	ilike,
	inArray,
	isNull,
	lte,
	type SQL,
	sql,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
	product,
	productCollectionAssignment,
	productVariant,
} from "@/lib/db/schema/store/product";

export async function getStorefrontProducts(params: {
	organizationId: string;
	collectionId?: string;
	minPrice?: number;
	maxPrice?: number;
	sort?: string; // "price_asc", "price_desc", "newest", "name_asc", "name_desc"
	q?: string;
	limit?: number;
	offset?: number;
	locationId?: string;
}) {
	const {
		organizationId,
		collectionId,
		minPrice,
		maxPrice,
		sort,
		q,
		limit = 20,
		offset = 0,
		locationId,
	} = params;

	const conditions = [
		eq(product.organizationId, organizationId),

		eq(product.status, "active"),
		isNull(product.deletedAt),
	];

	if (q) {
		conditions.push(ilike(product.name, `%${q}%`));
	}

	// Filter by collection
	if (collectionId) {
		const productIdsInCollection = db
			.select({ productId: productCollectionAssignment.productId })
			.from(productCollectionAssignment)
			.where(eq(productCollectionAssignment.collectionId, collectionId));

		conditions.push(inArray(product.id, productIdsInCollection));
	}

	const whereConditions = [...conditions];

	if (minPrice !== undefined) {
		whereConditions.push(gte(productVariant.price, minPrice.toString()));
	}
	if (maxPrice !== undefined) {
		whereConditions.push(lte(productVariant.price, maxPrice.toString()));
	}

	let orderByClause: SQL | unknown = desc(product.createdAt);

	if (sort === "price_asc") {
		orderByClause = sql`min(${productVariant.price}) asc`;
	} else if (sort === "price_desc") {
		orderByClause = sql`min(${productVariant.price}) desc`;
	} else if (sort === "newest") {
		orderByClause = desc(product.createdAt);
	} else if (sort === "name_asc") {
		orderByClause = asc(product.name);
	} else if (sort === "name_desc") {
		orderByClause = desc(product.name);
	}

	const products = await db
		.select({
			id: product.id,
			name: product.name,
			translations: product.translations,
			thumbnailImage: product.thumbnailImage,
			createdAt: product.createdAt,
			allowBackorders: product.allowBackorders,
			minPrice: sql<number>`min(${productVariant.price})`.mapWith(Number),
			maxPrice: sql<number>`max(${productVariant.price})`.mapWith(Number),
		})
		.from(product)
		.leftJoin(
			productVariant,
			and(
				eq(product.id, productVariant.productId),
				isNull(productVariant.deletedAt),
			),
		)
		.where(and(...whereConditions))
		.groupBy(product.id)
		.orderBy(orderByClause as SQL)
		.limit(limit)
		.offset(offset);

	// Fetch variants with stock for each product
	const productsWithVariants = await Promise.all(
		products.map(async (p) => {
			const variants = await db
				.select()
				.from(productVariant)
				.where(
					and(
						eq(productVariant.productId, p.id),
						isNull(productVariant.deletedAt),
					),
				);

			// Get stock for each variant if locationId provided
			const variantsWithStock = locationId
				? await Promise.all(
						variants.map(async (variant) => {
							const [stockInfo] = await db.query.productVariantStock.findMany({
								where: (stock, { and, eq }) =>
									and(
										eq(stock.productVariantId, variant.id),
										eq(stock.organizationId, organizationId),
										eq(stock.locationId, locationId),
									),
								limit: 1,
							});

							const availableQuantity = stockInfo
								? Number(stockInfo.quantity || 0) -
									Number(stockInfo.reservedQuantity || 0)
								: 0;

							return {
								...variant,
								stock: {
									quantity: stockInfo?.quantity || 0,
									reservedQuantity: stockInfo?.reservedQuantity || 0,
									availableQuantity,
								},
							};
						}),
					)
				: variants.map((v) => ({ ...v, stock: null }));

			return {
				...p,
				variants: variantsWithStock,
			};
		}),
	);

	return productsWithVariants;
}

export async function getStorefrontProduct(params: {
	organizationId: string;
	productId: string;
	locationId?: string;
}) {
	const { organizationId, productId, locationId } = params;

	const foundProduct = await db
		.select()
		.from(product)
		.where(
			and(
				eq(product.id, productId),
				eq(product.organizationId, organizationId),
				eq(product.status, "active"),
				isNull(product.deletedAt),
			),
		)
		.limit(1);

	if (!foundProduct.length) return null;

	const variants = await db
		.select()
		.from(productVariant)
		.where(
			and(
				eq(productVariant.productId, productId),
				isNull(productVariant.deletedAt),
			),
		);

	// Get stock information for each variant if locationId is provided
	const variantsWithStock = await Promise.all(
		variants.map(async (variant) => {
			if (!locationId) {
				return { ...variant, stock: null };
			}

			const [stockInfo] = await db.query.productVariantStock.findMany({
				where: (stock, { and, eq }) =>
					and(
						eq(stock.productVariantId, variant.id),
						eq(stock.organizationId, organizationId),
						eq(stock.locationId, locationId),
					),
				limit: 1,
			});

			const availableQuantity = stockInfo
				? Number(stockInfo.quantity || 0) -
					Number(stockInfo.reservedQuantity || 0)
				: 0;

			return {
				...variant,
				stock: {
					quantity: stockInfo?.quantity || 0,
					reservedQuantity: stockInfo?.reservedQuantity || 0,
					availableQuantity,
				},
			};
		}),
	);

	return {
		...foundProduct[0],
		variants: variantsWithStock,
	};
}
