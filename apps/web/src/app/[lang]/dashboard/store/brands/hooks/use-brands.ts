import { useQuery } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

export interface BrandsResponse {
	total: number;
	data: any[];
}

export const useBrands = () => {
	return useQuery<BrandsResponse, Error>({
		queryKey: ["brands"],
		queryFn: async () => {
			const response = await hc.api.store.brands.$get({
				query: { limit: "100", offset: "0" },
			});

			if (!response.ok) {
				const errorText = await response
					.text()
					.catch(() => response.statusText);
				throw new Error(`Failed to fetch brands: ${errorText}`);
			}

			const json = await response.json();

			if ("error" in json) {
				throw new Error(json.error.message || "Failed to fetch brands");
			}

			return json as BrandsResponse;
		},
	});
};
