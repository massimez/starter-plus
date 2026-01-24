import { useQuery } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

/**
 * @deprecated Use useInvoices from use-invoices.ts instead
 */
export function useCustomerInvoices(limit = 50) {
	return useQuery({
		queryKey: ["financial", "invoices", "receivable", limit],
		queryFn: async () => {
			const res = await hc.api.financial.invoices.$get({
				query: { type: "receivable", limit: limit.toString() },
			});
			const json = await res.json();
			return json.data;
		},
	});
}

/**
 * @deprecated Use useInvoice from use-invoices.ts instead
 */
export function useInvoice(id: string) {
	return useQuery({
		queryKey: ["financial", "invoice", id],
		queryFn: async () => {
			const res = await hc.api.financial.invoices[":id"].$get({
				param: { id },
			});
			if (!res.ok) {
				throw new Error("Failed to fetch invoice");
			}
			const json = await res.json();
			return json.data;
		},
		enabled: !!id,
	});
}
