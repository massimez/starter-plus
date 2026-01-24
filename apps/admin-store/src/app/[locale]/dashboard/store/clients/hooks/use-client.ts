import { useQuery } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

export const useClient = (clientId: string) => {
	return useQuery({
		queryKey: ["client", clientId],
		queryFn: async () => {
			const response = await hc.api.store.clients[":id"].$get({
				param: { id: clientId },
			});

			if (!response.ok) {
				const errorText = await response
					.text()
					.catch(() => response.statusText);
				throw new Error(`Failed to fetch client: ${errorText}`);
			}

			const json = await response.json();

			if (json.error) {
				throw new Error(json.error.message || "Failed to fetch client");
			}

			return json.data;
		},
		enabled: !!clientId,
	});
};
