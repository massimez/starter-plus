import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

export function useFinancialTransactions(limit = 100) {
	return useQuery({
		queryKey: ["financial", "transactions", limit],
		queryFn: async () => {
			const res = await hc.api.financial.transactions.$get({
				query: { limit: limit.toString() },
			});
			return res.json();
		},
	});
}

export function useBankAccounts() {
	return useQuery({
		queryKey: ["financial", "bank-accounts"],
		queryFn: async () => {
			const res = await hc.api.financial.banking["bank-accounts"].$get();
			return res.json();
		},
	});
}

export function useCreateBankTransaction() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			bankAccountId: string;
			transactionDate: Date;
			transactionType:
				| "deposit"
				| "withdrawal"
				| "transfer"
				| "fee"
				| "interest";
			amount: number;
			description?: string;
			referenceNumber?: string;
			payeePayer?: string;
		}) => {
			const res = await hc.api.financial.banking["bank-transactions"].$post({
				json: data,
			});
			return res.json();
		},
		onSuccess: () => {
			// Invalidate both transactions and bank transactions queries
			queryClient.invalidateQueries({
				queryKey: ["financial", "transactions"],
			});
			queryClient.invalidateQueries({
				queryKey: ["financial", "bank-transactions"],
			});
		},
	});
}

export function useEnsureCashAccount() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const apiBaseUrl =
				process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
			const res = await fetch(
				`${apiBaseUrl}/api/financial/banking/bank-accounts/cash/ensure`,
				{
					method: "POST",
					credentials: "include",
				},
			);
			if (!res.ok) {
				throw new Error("Failed to ensure cash account");
			}
			return res.json();
		},
		onSuccess: () => {
			// Invalidate bank accounts query to refresh the list
			queryClient.invalidateQueries({
				queryKey: ["financial", "bank-accounts"],
			});
		},
	});
}
