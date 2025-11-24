import {
	and,
	asc,
	desc,
	eq,
	gte,
	ilike,
	inArray,
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
	} = params;

	const conditions = [
		eq(product.organizationId, organizationId),
		eq(product.isActive, true),
		eq(product.status, "active"),
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
			translations: product.translations,
			thumbnailImage: product.thumbnailImage,
			createdAt: product.createdAt,
			minPrice: sql<number>`min(${productVariant.price})`.mapWith(Number),
			maxPrice: sql<number>`max(${productVariant.price})`.mapWith(Number),
		})
		.from(product)
		.leftJoin(productVariant, eq(product.id, productVariant.productId))
		.where(and(...whereConditions))
		.groupBy(product.id)
		.orderBy(orderByClause as SQL)
		.limit(limit)
		.offset(offset);

	return products;
}

export async function getStorefrontProduct(params: {
	organizationId: string;
	productId: string;
}) {
	const { organizationId, productId } = params;

	const foundProduct = await db
		.select()
		.from(product)
		.where(
			and(
				eq(product.id, productId),
				eq(product.organizationId, organizationId),
				eq(product.isActive, true),
			),
		)
		.limit(1);

	if (!foundProduct.length) return null;

	const variants = await db
		.select()
		.from(productVariant)
		.where(eq(productVariant.productId, productId));

	return {
		...foundProduct[0],
		variants,
	};
}
