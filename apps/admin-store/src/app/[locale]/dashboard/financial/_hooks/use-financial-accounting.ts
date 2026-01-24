import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

export function useFinancialAccounting() {
	const queryClient = useQueryClient();

	const useAccounts = () => {
		return useQuery({
			queryKey: ["financial", "accounts"],
			queryFn: async () => {
				const res = await hc.api.financial.accounting.accounts.$get();
				const json = await res.json();
				return json.data;
			},
		});
	};

	const useJournalEntries = () => {
		return useQuery({
			queryKey: ["financial", "journal-entries"],
			queryFn: async () => {
				const res = await hc.api.financial.accounting["journal-entries"].$get();
				const json = await res.json();
				return json.data;
			},
		});
	};

	const useCreateJournalEntry = () => {
		return useMutation({
			mutationFn: async (data: {
				entryDate: string; // API accepts ISO date string
				description: string;
				lines: {
					accountId: string;
					debitAmount: string;
					creditAmount: string;
					description?: string;
				}[];
				referenceType?: string;
				referenceId?: string;
			}) => {
				const res = await hc.api.financial.accounting["journal-entries"].$post({
					json: data as typeof data & { entryDate: Date }, // Type assertion needed due to z.coerce.date() inference
				});
				const json = await res.json();
				return json.data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["financial", "journal-entries"],
				});
			},
		});
	};

	const usePostJournalEntry = () => {
		return useMutation({
			mutationFn: async (entryId: string) => {
				const res = await hc.api.financial.accounting["journal-entries"][
					":id"
				].post.$post({
					param: { id: entryId },
				});
				const json = await res.json();
				return json.data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["financial", "journal-entries"],
				});
			},
		});
	};

	const useDeleteJournalEntry = () => {
		return useMutation({
			mutationFn: async (entryId: string) => {
				const res = await hc.api.financial.accounting["journal-entries"][
					":id"
				].$delete({
					param: { id: entryId },
				});
				const json = await res.json();
				return json.data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["financial", "journal-entries"],
				});
			},
		});
	};

	const useCreateAccount = () => {
		return useMutation({
			mutationFn: async (data: {
				code: string;
				name: string;
				accountType: "asset" | "liability" | "equity" | "revenue" | "expense";
				category?: string;
				normalBalance: "debit" | "credit";
				description?: string;
				allowManualEntries: boolean;
			}) => {
				const res = await hc.api.financial.accounting.accounts.$post({
					json: data,
				});
				const json = await res.json();
				return json.data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["financial", "accounts"],
				});
			},
		});
	};

	const useUpdateAccount = () => {
		return useMutation({
			mutationFn: async ({
				id,
				data,
			}: {
				id: string;
				data: {
					name?: string;
					description?: string;
					isActive?: boolean;
				};
			}) => {
				const res = await hc.api.financial.accounting.accounts[":id"].$patch({
					param: { id },
					json: data,
				});
				const json = await res.json();
				return json.data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["financial", "accounts"],
				});
			},
		});
	};

	const useTrialBalance = (asOf?: Date) => {
		return useQuery({
			queryKey: ["financial", "trial-balance", asOf?.toISOString()],
			queryFn: async () => {
				const params = asOf
					? { query: { asOf: asOf.toISOString() } }
					: undefined;
				const res =
					await hc.api.financial.accounting["trial-balance"].$get(params);
				const json = await res.json();
				return json.data;
			},
		});
	};

	return {
		useAccounts,
		useJournalEntries,
		useCreateJournalEntry,
		usePostJournalEntry,
		useDeleteJournalEntry,
		useCreateAccount,
		useUpdateAccount,
		useTrialBalance,
	};
}
