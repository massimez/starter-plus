import { useQuery } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

export function useCustomerInvoices(limit = 50) {
	return useQuery({
		queryKey: ["financial", "invoices", limit],
		queryFn: async () => {
			const res = await hc.api.financial.receivables["customer-invoices"].$get({
				query: { limit: limit.toString() },
			});
			const json = await res.json();
			return json.data;
		},
	});
}

export function useInvoice(id: string) {
	return useQuery({
		queryKey: ["financial", "invoice", id],
		queryFn: async () => {
			const res = await hc.api.financial.receivables["customer-invoices"][
				":id"
			].$get({
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
