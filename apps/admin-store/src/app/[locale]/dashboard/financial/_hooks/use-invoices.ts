import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

/**
 * Fetch invoices (receivables or payables)
 */
export function useInvoices(
	type: "receivable" | "payable",
	options: {
		limit?: string;
		offset?: string;
		status?: string | null;
		from?: string | null;
		to?: string | null;
		setTotal?: (total: number) => void;
	} = {},
) {
	const { limit = "10", offset = "0", status, from, to, setTotal } = options;

	return useQuery({
		queryKey: ["financial", "invoices", type, limit, offset, status, from, to],
		queryFn: async () => {
			const res = await hc.api.financial.invoices.$get({
				query: {
					type,
					limit,
					offset,
					status: status || undefined,
					from: from || undefined,
					to: to || undefined,
				},
			});
			const json = await res.json();

			if (setTotal && json?.data?.meta) {
				setTotal(json.data.meta.total);
			}

			return json.data;
		},
	});
}

/**
 * Fetch invoice stats (receivables or payables)
 */
export function useInvoiceStats(type: "receivable" | "payable") {
	return useQuery({
		queryKey: ["financial", "invoices", "stats", type],
		queryFn: async () => {
			const res = await hc.api.financial.invoices.stats.$get({
				query: { type },
			});
			const json = await res.json();
			return json.data;
		},
	});
}

/**
 * Fetch single invoice by ID
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

/**
 * Create new invoice (receivable or payable)
 */
export function useCreateInvoice() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			invoiceType: "receivable" | "payable";
			customerId?: string;
			supplierId?: string;
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
				json: data,
			});
			if (!res.ok) {
				const json = await res.json();
				throw new Error(json.error?.message || "Failed to create invoice");
			}
			const json = await res.json();
			return json.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["financial", "invoices", variables.invoiceType],
			});
		},
	});
}

/**
 * Update existing invoice
 */
export function useUpdateInvoice() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			data,
		}: {
			id: string;
			data: {
				invoiceType: "receivable" | "payable";
				customerId?: string;
				supplierId?: string;
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
			};
		}) => {
			const res = await hc.api.financial.invoices[":id"].$put({
				param: { id },
				json: data,
			});
			if (!res.ok) {
				const json = await res.json();
				throw new Error(json.error?.message || "Failed to update invoice");
			}
			const json = await res.json();
			return json.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["financial", "invoices", variables.data.invoiceType],
			});
			queryClient.invalidateQueries({
				queryKey: ["financial", "invoice", variables.id],
			});
		},
	});
}

/**
 * Delete invoice
 */
export function useDeleteInvoice() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const res = await hc.api.financial.invoices[":id"].$delete({
				param: { id },
			});
			if (!res.ok) {
				const json = await res.json();
				throw new Error(json.error?.message || "Failed to delete invoice");
			}
			const json = await res.json();
			return json.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["financial", "invoices"],
			});
		},
	});
}

/**
 * Approve invoice
 */
export function useApproveInvoice() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const res = await hc.api.financial.invoices[":id"].approve.$post({
				param: { id },
			});
			if (!res.ok) {
				const json = await res.json();
				throw new Error(json.error?.message || "Failed to approve invoice");
			}
			const json = await res.json();
			return json.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["financial", "invoices"],
			});
		},
	});
}

/**
 * Record payment (for any invoice type)
 */
export function useRecordPayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			paymentType: "received" | "sent";
			customerId?: string;
			supplierId?: string;
			amount: number;
			paymentDate: Date;
			paymentMethod: "bank_transfer" | "check" | "cash" | "card" | "online";
			referenceNumber?: string;
			allocations: {
				invoiceId: string;
				amount: number;
			}[];
		}) => {
			const res = await hc.api.financial.invoices.payments.$post({
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
				queryKey: ["financial", "invoices"],
			});
			queryClient.invalidateQueries({
				queryKey: ["financial", "payments"],
			});
		},
	});
}

/**
 * Get party balance (customer or supplier)
 */
export function usePartyBalance(
	partyId: string,
	partyType: "customer" | "supplier",
) {
	return useQuery({
		queryKey: ["financial", "balance", partyType, partyId],
		queryFn: async () => {
			const res = await hc.api.financial.invoices.balance[":partyType"][
				":partyId"
			].$get({
				param: { partyType, partyId },
			});
			if (!res.ok) {
				throw new Error("Failed to fetch balance");
			}
			const json = await res.json();
			return json.data;
		},
		enabled: !!partyId && !!partyType,
	});
}

/**
 * Get payments
 */
export function usePayments(type?: "received" | "sent", limit = 50) {
	return useQuery({
		queryKey: ["financial", "payments", type, limit],
		queryFn: async () => {
			const res = await hc.api.financial.invoices.payments.$get({
				query: type
					? { type, limit: limit.toString() }
					: { limit: limit.toString() },
			});
			const json = await res.json();
			return json.data;
		},
	});
}
