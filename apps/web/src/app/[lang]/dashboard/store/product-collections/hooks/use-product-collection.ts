import { useQuery } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

export interface ProductCollection {
	id: string;
	name: string;
	slug: string;
	description?: string | null;
	parentId?: string | null;
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
	createdAt: string;
	updatedAt: string | null;
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
				return { data: [] };
			}
			const result = await res.json();
			if (result.error) {
				console.error(
					"Failed to fetch collections: API returned an error",
					result.error,
				);
				return { data: [] };
			}
			if (result.data && Array.isArray(result.data)) {
				return { data: result.data as ProductCollection[] };
			}
			console.error(
				"Failed to fetch collections: Unexpected API response format",
				result,
			);
			return { data: [] };
		},
	});
}
