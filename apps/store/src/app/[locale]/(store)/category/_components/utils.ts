import type { Collection } from "@/lib/storefront-types";

export type { Collection } from "@/lib/storefront-types";

export function getCollectionPath(
	collections: Collection[],
	slug: string,
	path: Collection[] = [],
): Collection[] | null {
	for (const collection of collections) {
		if (collection.slug === slug) {
			return [...path, collection];
		}
		if (collection.children) {
			const foundPath = getCollectionPath(collection.children, slug, [
				...path,
				collection,
			]);
			if (foundPath) return foundPath;
		}
	}
	return null;
}
