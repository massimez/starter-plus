import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

// Type for dynamic expense routes (workaround for Hono client type generation)
type ExpenseWithId = {
	approve: { $post: () => Promise<Response> };
	reject: { $post: () => Promise<Response> };
};

export function useFinancialExpenses(
	options: {
		limit?: string;
		offset?: string;
		status?: string | null;
		from?: string | null;
		to?: string | null;
		categoryId?: string | null;
		setTotal?: (total: number) => void;
	} = {},
) {
	const {
		limit = "50",
		offset = "0",
		status,
		from,
		to,
		categoryId,
		setTotal,
	} = options;

	return useQuery({
		queryKey: [
			"financial",
			"expenses",
			limit,
			offset,
			status,
			from,
			to,
			categoryId,
		],
		queryFn: async () => {
			const res = await hc.api.financial.expenses.expenses.$get({
				query: {
					limit,
					offset,
					status: status || undefined,
					from: from || undefined,
					to: to || undefined,
					categoryId: categoryId || undefined,
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

export function useExpenseCategories() {
	return useQuery({
		queryKey: ["financial", "expense-categories"],
		queryFn: async () => {
			const res = await hc.api.financial.expenses["expense-categories"].$get();
			const json = await res.json();
			return json.data;
		},
	});
}

export function useCreateExpenseCategory() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: {
			name: string;
			description?: string;
			glAccountId?: string;
		}) => {
			const res = await hc.api.financial.expenses["expense-categories"].$post({
				json: data,
			});
			if (!res.ok) {
				throw new Error("Failed to create expense category");
			}
			const json = await res.json();
			return json.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["financial", "expense-categories"],
			});
		},
	});
}

export function useCreateExpense() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: {
			categoryId: string;
			amount: number;
			currency: string;
			expenseDate: Date;
			description: string;
		}) => {
			const res = await hc.api.financial.expenses.expenses.$post({
				json: data,
			});
			if (!res.ok) {
				throw new Error("Failed to create expense");
			}
			const json = await res.json();
			return json.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["financial", "expenses"] });
		},
	});
}

export function useApproveExpense() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const expenses = hc.api.financial.expenses.expenses as unknown as Record<
				string,
				ExpenseWithId
			>;
			const res = await expenses[id]?.approve.$post();
			if (!res?.ok) {
				throw new Error("Failed to approve expense");
			}
			const json = await res.json();
			return json.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["financial", "expenses"] });
		},
	});
}

export function useRejectExpense() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const expenses = hc.api.financial.expenses.expenses as unknown as Record<
				string,
				ExpenseWithId
			>;
			const res = await expenses[id]?.reject.$post();
			if (!res?.ok) {
				throw new Error("Failed to reject expense");
			}
			const json = await res.json();
			return json.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["financial", "expenses"] });
		},
	});
}

export function useUpdateExpense() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: {
			id: string;
			categoryId?: string;
			amount?: number;
			currency?: string;
			expenseDate?: Date;
			description?: string;
		}) => {
			const { id, ...updateData } = data;
			// Workaround for Hono client type with params
			const expenses = hc.api.financial.expenses.expenses as unknown as Record<
				string,
				{ $put: (args: { json: typeof updateData }) => Promise<Response> }
			>;

			const res = await expenses[id]?.$put({
				json: updateData,
			});

			if (!res?.ok) {
				throw new Error("Failed to update expense");
			}
			const json = await res.json();
			return json.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["financial", "expenses"] });
		},
	});
}

export function usePayExpense() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const expenses = hc.api.financial.expenses.expenses as unknown as Record<
				string,
				{ pay: { $post: () => Promise<Response> } }
			>;
			const res = await expenses[id]?.pay.$post();
			if (!res?.ok) {
				throw new Error("Failed to pay expense");
			}
			const json = await res.json();
			return json.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["financial", "expenses"] });
		},
	});
}
