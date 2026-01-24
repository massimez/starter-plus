import { useQuery } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

type InventoryParams = {
	locationId?: string;
	limit?: string;
	offset?: string;
	search?: string;
	collectionId?: string;
	setTotal?: (total: number) => void;
};

export const useGroupedInventory = ({
	locationId,
	limit = "20",
	offset = "0",
	search,
	collectionId,
}: InventoryParams = {}) => {
	return useQuery({
		queryKey: [
			"inventory-grouped",
			locationId,
			limit,
			offset,
			search,
			collectionId,
		],
		queryFn: async () => {
			const response = await hc.api.store.inventory["grouped-by-product"].$get({
				query: {
					locationId,
					limit,
					offset,
					search,
					collectionId,
				},
			});

			if (!response.ok) {
				const errorText = await response
					.text()
					.catch(() => response.statusText);
				throw new Error(`Failed to fetch grouped inventory: ${errorText}`);
			}

			const json = await response.json();

			if (json.error) {
				throw new Error(
					json.error.message || "Failed to fetch grouped inventory",
				);
			}

			const data = json.data;

			return data.data;
		},
	});
};
