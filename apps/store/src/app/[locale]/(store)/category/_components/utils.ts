export interface Collection {
	id: string;
	name: string;
	slug: string;
	children?: Collection[];
	image?: string | null;
	sortOrder?: number;
}

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
