import { useQuery } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

export const useClients = () => {
	return useQuery({
		queryKey: ["clients"],
		queryFn: async () => {
			const response = await hc.api.store.clients.$get({
				query: { limit: "100", offset: "0" },
			});

			if (!response.ok) {
				const errorText = await response
					.text()
					.catch(() => response.statusText);
				throw new Error(`Failed to fetch clients: ${errorText}`);
			}

			const json = await response.json();

			if (json.error) {
				throw new Error(json.error.message || "Failed to fetch clients");
			}

			return json.data;
		},
	});
};
