import { useQuery } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

export const useOrders = (status?: string) => {
	const query = {
		limit: "20",
		offset: "0",
		orderBy: "createdAt",
		direction: "desc" as const,
		...(status && { status }),
	};

	return useQuery({
		queryKey: ["orders", status],
		queryFn: async () => {
			const result = await hc.api.store.orders.$get({
				query,
			});
			return (await result.json()).data;
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
};
