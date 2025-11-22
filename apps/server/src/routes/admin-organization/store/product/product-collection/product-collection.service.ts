import { and, eq } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/lib/db";
import { productCollection } from "@/lib/db/schema";
import { validateOrgId } from "@/lib/utils/validator";
import type {
	insertProductCollectionSchema,
	updateProductCollectionSchema,
} from "../schema";

type InsertProductCollection = z.infer<typeof insertProductCollectionSchema>;
type UpdateProductCollection = z.infer<typeof updateProductCollectionSchema>;

/**
 * Create a new product collection
 */
export async function createProductCollection(
	productCollectionData: InsertProductCollection,
	orgId: string,
) {
	const [newProductCollection] = await db
		.insert(productCollection)
		.values({
			...productCollectionData,
			organizationId: orgId,
		})
		.returning();
	return newProductCollection;
}

/**
 * Get all product collections for an organization
 */
export async function getProductCollections(orgId: string) {
	const foundProductCollections = await db
		.select()
		.from(productCollection)
		.where(eq(productCollection.organizationId, validateOrgId(orgId)));
	return foundProductCollections;
}

/**
 * Get a single product collection by ID
 */
export async function getProductCollection(
	productCollectionId: string,
	orgId: string,
) {
	const [foundProductCollection] = await db
		.select()
		.from(productCollection)
		.where(
			and(
				eq(productCollection.id, productCollectionId),
				eq(productCollection.organizationId, validateOrgId(orgId)),
			),
		)
		.limit(1);
	return foundProductCollection;
}

/**
 * Update a product collection
 */
export async function updateProductCollection(
	productCollectionId: string,
	productCollectionData: UpdateProductCollection,
	orgId: string,
) {
	const [updatedProductCollection] = await db
		.update(productCollection)
		.set(productCollectionData)
		.where(
			and(
				eq(productCollection.id, productCollectionId),
				eq(productCollection.organizationId, validateOrgId(orgId)),
			),
		)
		.returning();
	return updatedProductCollection;
}

/**
 * Delete a product collection
 */
export async function deleteProductCollection(
	productCollectionId: string,
	orgId: string,
) {
	const [deletedProductCollection] = await db
		.delete(productCollection)
		.where(
			and(
				eq(productCollection.id, productCollectionId),
				eq(productCollection.organizationId, validateOrgId(orgId)),
			),
		)
		.returning();
	return deletedProductCollection;
}
