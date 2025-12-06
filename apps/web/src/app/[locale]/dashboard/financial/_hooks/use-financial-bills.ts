import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

export function useSupplierInvoices(limit = 50) {
	return useQuery({
		queryKey: ["financial", "bills", limit],
		queryFn: async () => {
			const res = await hc.api.financial.payables["supplier-invoices"].$get({
				query: { limit: limit.toString() },
			});
			const json = await res.json();
			return json.data;
		},
	});
}

export function useBill(id: string) {
	return useQuery({
		queryKey: ["financial", "bill", id],
		queryFn: async () => {
			const res = await hc.api.financial.payables["supplier-invoices"][
				":id"
			].$get({
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
				expenseAccountId: string;
				description: string;
				quantity: number;
				unitPrice: number;
				taxRate?: number;
			}[];
		}) => {
			const res = await hc.api.financial.payables["supplier-invoices"].$post({
				json: data,
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
				queryKey: ["financial", "bills"],
			});
		},
	});
}

export function useUpdateBill() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			data,
		}: {
			id: string;
			data: {
				supplierId: string;
				invoiceNumber: string;
				invoiceDate: Date;
				dueDate: Date;
				currency: string;
				items: {
					expenseAccountId: string;
					description: string;
					quantity: number;
					unitPrice: number;
					taxRate?: number;
				}[];
			};
		}) => {
			const res = await hc.api.financial.payables["supplier-invoices"][
				":id"
			].$put({
				param: { id },
				json: data,
			});
			if (!res.ok) {
				const json = await res.json();
				throw new Error(json.error?.message || "Failed to update bill");
			}
			const json = await res.json();
			return json.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["financial", "bills"],
			});
		},
	});
}

export function useApproveBill() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const res = await hc.api.financial.payables["supplier-invoices"][
				":id"
			].approve.$post({
				param: { id },
			});
			if (!res.ok) {
				const json = await res.json();
				throw new Error(json.error?.message || "Failed to approve bill");
			}
			const json = await res.json();
			return json.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["financial", "bills"],
			});
		},
	});
}

export function useRecordPayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			supplierId: string;
			amount: number;
			paymentDate: Date;
			paymentMethod: "bank_transfer" | "check" | "cash" | "card";
			referenceNumber?: string;
			bankAccountId?: string;
			allocations: {
				invoiceId: string;
				amount: number;
			}[];
		}) => {
			const res = await hc.api.financial.payables["supplier-payments"].$post({
				json: data,
			});
			if (!res.ok) {
				const json = await res.json();
				throw new Error(json.error?.message || "Failed to record payment");
			}
			const json = await res.json();
			return json.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["financial", "bills"],
			});
		},
	});
}
