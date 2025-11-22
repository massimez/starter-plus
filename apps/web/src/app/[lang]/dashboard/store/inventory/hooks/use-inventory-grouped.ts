import { useQuery } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

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

			const json = await response.json();

			if (json.error) {
				throw new Error(
					json.error.message || "Failed to fetch grouped inventory",
				);
			}

			return json.data;
		},
	});
};
