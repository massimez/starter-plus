import { useQuery } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

interface ProductVariantWithStock {
	id: string;
	sku?: string;
	price?: number;
	translations?: Array<{
		name?: string;
	}>;
	stock: {
		quantity: number;
		reservedQuantity: number;
	};
}

interface ProductWithVariants {
	id: string;
	name?: string;
	translations?: Array<{
		name?: string;
		languageCode: string;
	}>;
	variants: ProductVariantWithStock[];
}

interface GroupedInventoryApiResponseSuccess {
	data: ProductWithVariants[];
}

interface GroupedInventoryApiResponseError {
	success: boolean;
	error: {
		name: string;
		message?: string;
		issues: {
			code: string;
			path: (string | number)[];
			message?: string;
		}[];
	};
}

type GroupedInventoryApiResponse =
	| GroupedInventoryApiResponseSuccess
	| GroupedInventoryApiResponseError;

export const useGroupedInventory = (locationId?: string) => {
	return useQuery({
		queryKey: ["inventory-grouped", locationId],
		queryFn: async () => {
			const params = locationId ? { locationId } : {};
			const response = await hc.api.store.inventory["grouped-by-product"].$get({
				query: params,
			});

			if (!response.ok) {
				const errorText = await response
					.text()
					.catch(() => response.statusText);
				throw new Error(`Failed to fetch grouped inventory: ${errorText}`);
			}

			const json: GroupedInventoryApiResponse = await response.json();

			if ("error" in json) {
				throw new Error(
					json.error.message || "Failed to fetch grouped inventory",
				);
			}

			return (json as GroupedInventoryApiResponseSuccess).data;
		},
	});
};
