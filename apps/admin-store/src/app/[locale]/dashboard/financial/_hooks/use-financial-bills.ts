import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

/**
 * @deprecated Use useInvoices from use-invoices.ts instead
 */
export function useSupplierInvoices(limit = 50) {
	return useQuery({
		queryKey: ["financial", "invoices", "payable", limit],
		queryFn: async () => {
			const res = await hc.api.financial.invoices.$get({
				query: { type: "payable", limit: limit.toString() },
			});
			const json = await res.json();
			return json.data;
		},
	});
}

/**
 * @deprecated Use useInvoice from use-invoices.ts instead
 */
export function useBill(id: string) {
	return useQuery({
		queryKey: ["financial", "invoice", id],
		queryFn: async () => {
			const res = await hc.api.financial.invoices[":id"].$get({
				param: { id },
			});
			if (!res.ok) {
				throw new Error("Failed to fetch bill");
			}
			const json = await res.json();
			return json.data;
		},
		enabled: !!id,
	});
}

/**
 * @deprecated Use useCreateInvoice from use-invoices.ts instead
 */
export function useCreateBill() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			supplierId: string;
			invoiceNumber: string;
			invoiceDate: Date;
			dueDate: Date;
			currency: string;
			items: {
				accountId: string;
				description: string;
				quantity: number;
				unitPrice: number;
				taxRate?: number;
			}[];
		}) => {
			const res = await hc.api.financial.invoices.$post({
				json: {
					invoiceType: "payable",
					...data,
				},
			});
			if (!res.ok) {
				const json = await res.json();
				throw new Error(json.error?.message || "Failed to create bill");
			}
			const json = await res.json();
			return json.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["financial", "invoices", "payable"],
			});
		},
	});
}
