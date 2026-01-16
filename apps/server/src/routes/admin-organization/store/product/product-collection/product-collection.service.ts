import { and, desc, eq } from "drizzle-orm";
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
 * Get all product collections for an organization in nested structure
 */
export async function getProductCollections(orgId: string) {
	const foundProductCollections = await db
		.select()
		.from(productCollection)
		.where(eq(productCollection.organizationId, validateOrgId(orgId)))
		.orderBy(desc(productCollection.createdAt));

	// Build nested structure
	return buildNestedCollections(foundProductCollections);
}

/**
 * Helper function to build nested collection structure
 */
function buildNestedCollections<
	T extends { id: string; parentId: string | null; children?: T[] },
>(collections: T[]): T[] {
	const collectionMap = new Map<string, T>();
	const rootCollections: T[] = [];

	// First pass: create a map and add children property
	for (const collection of collections) {
		collectionMap.set(collection.id, { ...collection, children: [] });
	}

	// Second pass: build the tree structure
	for (const collection of collections) {
		const node = collectionMap.get(collection.id);
		if (!node) continue;

		if (collection.parentId) {
			const parent = collectionMap.get(collection.parentId);
			if (parent) {
				parent.children?.push(node);
			} else {
				// Parent not found, treat as root
				rootCollections.push(node);
			}
		} else {
			// No parent, it's a root collection
			rootCollections.push(node);
		}
	}

	return rootCollections;
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
