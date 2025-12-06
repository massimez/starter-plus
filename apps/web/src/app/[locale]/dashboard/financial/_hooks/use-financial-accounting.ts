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

	return {
		useAccounts,
		useJournalEntries,
		useCreateJournalEntry,
		usePostJournalEntry,
		useDeleteJournalEntry,
	};
}
