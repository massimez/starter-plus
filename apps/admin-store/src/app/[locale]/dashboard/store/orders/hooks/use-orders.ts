import { useQuery } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

interface UseOrdersParams {
	status?: string;
	limit?: string;
	offset?: string;
	search?: string;
	setTotal?: (total: number) => void;
}

export const useOrders = ({
	status,
	limit = "10",
	offset = "0",
	search,
	setTotal,
}: UseOrdersParams = {}) => {
	const query = {
		limit,
		offset,
		orderBy: "createdAt",
		direction: "desc" as const,
		...(status && { status }),
		...(search && { search }),
	};

	return useQuery({
		queryKey: ["orders", status, limit, offset, search],
		queryFn: async () => {
			const result = await hc.api.store.orders.$get({
				query,
			});
			const res = await result.json();
			setTotal?.(res.data?.total || 0);
			return res.data;
		},
		staleTime: 1000,
	});
};
