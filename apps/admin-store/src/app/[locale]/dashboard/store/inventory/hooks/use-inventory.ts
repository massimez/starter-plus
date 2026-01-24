import { useQuery } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

export const useInventory = () => {
	return useQuery({
		queryKey: ["inventory"],
		queryFn: async () => {
			const response = await hc.api.store.products.$get({
				query: { limit: "100", offset: "0" },
			});

			if (!response.ok) {
				const errorText = await response
					.text()
					.catch(() => response.statusText);
				throw new Error(`Failed to fetch inventory: ${errorText}`);
			}

			const json = await response.json();

			if (json.error) {
				throw new Error(json.error.message || "Failed to fetch inventory");
			}

			return json.data;
		},
	});
};

export function useInventoryStock(productVariantId: string) {
	return useQuery({
		queryKey: ["inventory-stock", productVariantId],
		queryFn: async () => {
			const response = await hc.api.store.inventory.stock[
				":productVariantId"
			].$get({
				param: { productVariantId },
			});
			if (!response.ok) {
				throw new Error("Failed to fetch stock data");
			}
			const data = await response.json();
			return data.data;
		},
		enabled: !!productVariantId,
	});
}

export const useInventoryTransactions = (
	productVariantId?: string,
	params?: { limit?: string; offset?: string },
) => {
	return useQuery({
		queryKey: ["transactions", productVariantId || "all"],
		queryFn: async () => {
			const response = productVariantId
				? await hc.api.store.inventory["stock-transactions"][
						":productVariantId"
					].$get({
						param: { productVariantId },
						query: { limit: params?.limit ?? "300", offset: "0" },
					})
				: await hc.api.store.inventory["stock-transactions"].$get({
						query: { limit: params?.limit ?? "300", offset: "0" },
					});

			if (!response.ok) {
				const errorText = await response
					.text()
					.catch(() => response.statusText);
				throw new Error(`Failed to fetch transactions: ${errorText}`);
			}

			const json = await response.json();

			if (json.error) {
				throw new Error(json.error?.message || "Failed to fetch transactions");
			}
			return json.data;
		},
		enabled: true,
	});
};
