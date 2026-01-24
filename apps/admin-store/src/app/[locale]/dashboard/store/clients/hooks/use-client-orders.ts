import { useQuery } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

export const useClientOrders = (userId?: string) => {
	const query = {
		limit: "10",
		offset: "0",
		orderBy: "createdAt",
		direction: "desc" as const,
		...(userId && { userId }),
	};

	return useQuery({
		queryKey: ["client-orders", userId],
		queryFn: async () => {
			if (!userId) return { data: [], total: 0 };

			const result = await hc.api.store.orders.$get({
				query,
			});
			return (await result.json()).data;
		},
		enabled: !!userId,
		staleTime: 1000 * 60 * 2, // 2 minutes
	});
};
