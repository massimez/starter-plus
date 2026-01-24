import { useQuery } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

export interface ProductCollection {
	id: string;
	name: string;
	slug: string;
	description?: string | null;
	parentId?: string | null;
	image?: string | null;
	isActive?: boolean;
	isVisible?: boolean;
	sortOrder?: number;
	translations?:
		| {
				languageCode: string;
				name: string;
				slug: string;
				description?: string;
				metaTitle?: string;
				metaDescription?: string;
		  }[]
		| null;
	children?: ProductCollection[];
	createdAt: string;
	updatedAt: string | null;
}

/**
 * Flatten nested collections into a single array
 */
export function flattenCollections(
	collections: ProductCollection[],
): ProductCollection[] {
	const result: ProductCollection[] = [];

	function flatten(items: ProductCollection[]) {
		for (const item of items) {
			result.push(item);
			if (item.children && item.children.length > 0) {
				flatten(item.children);
			}
		}
	}

	flatten(collections);
	return result;
}

export function useProductCollections(languageCode?: string) {
	return useQuery({
		queryKey: ["product-collections", languageCode],
		queryFn: async () => {
			const res = await hc.api.store["product-collections"].$get({
				query: {
					lang: languageCode,
				},
			});
			if (!res.ok) {
				console.error("Failed to fetch collections: Network response not ok");
				return { data: [], flat: [] };
			}
			const result = await res.json();
			if (result.error) {
				console.error(
					"Failed to fetch collections: API returned an error",
					result.error,
				);
				return { data: [], flat: [] };
			}
			if (result.data && Array.isArray(result.data)) {
				const nestedData = result.data as ProductCollection[];
				return {
					data: nestedData,
					flat: flattenCollections(nestedData),
				};
			}
			console.error(
				"Failed to fetch collections: Unexpected API response format",
				result,
			);
			return { data: [], flat: [] };
		},
	});
}
