import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { productCollection } from "@/lib/db/schema/store/product";

export async function getStorefrontCollections(params: {
	organizationId: string;
}) {
	const { organizationId } = params;

	const collections = await db
		.select()
		.from(productCollection)
		.where(
			and(
				eq(productCollection.organizationId, organizationId),
				eq(productCollection.isActive, true),
				eq(productCollection.isVisible, true),
			),
		)
		.orderBy(asc(productCollection.sortOrder));

	// Build nested structure
	return buildNestedCollections(collections);
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
