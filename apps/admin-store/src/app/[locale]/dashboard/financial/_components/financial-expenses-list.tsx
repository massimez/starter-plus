"use client";

import { PaginationControls } from "@workspace/ui/components/pagination-controls";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { useNuqsPagination } from "@/hooks/use-nuqs-pagination";
import {
	useExpenseCategories,
	useFinancialExpenses,
} from "../_hooks/use-financial-expenses";
import { useFinancialFilters } from "../_hooks/use-financial-filters";
import { FinancialFilterBar } from "./financial-filter-bar";

interface FinancialExpensesListProps<T> {
	table: React.ComponentType<{ data: T[]; isLoading: boolean }>;
}

export function FinancialExpensesList<T>({
	table: Table,
}: FinancialExpensesListProps<T>) {
	const pagination = useNuqsPagination();
	const filters = useFinancialFilters(() => pagination.setPage(1));
	const { data: categories, isLoading: isCategoriesLoading } =
		useExpenseCategories();

	const { data: result, isLoading } = useFinancialExpenses({
		limit: pagination.limit.toString(),
		offset: pagination.offset.toString(),
		status: filters.status,
		from: filters.from,
		to: filters.to,
		categoryId: filters.categoryId,
		setTotal: pagination.setTotal,
	});

	// properties of result from useFinancialExpenses:
	// It returns `json.data` which is `{ data: T[], meta: ... }`
	const data = (result as unknown as { data: T[] })?.data || [];

	return (
		<div className="space-y-4">
			<FinancialFilterBar
				status={filters.status}
				onStatusChange={filters.setStatus}
				from={filters.from}
				onFromChange={filters.setFrom}
				to={filters.to}
				onToChange={filters.setTo}
				onClear={filters.clearFilters}
				hasActiveFilters={filters.hasActiveFilters}
			>
				<Select
					value={filters.categoryId || undefined}
					onValueChange={(val) => filters.setCategoryId(val || null)}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Category" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Categories</SelectItem>
						{categories?.map((category: { id: string; name: string }) => (
							<SelectItem key={category.id} value={category.id}>
								{category.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</FinancialFilterBar>

			<Table data={data} isLoading={isLoading || isCategoriesLoading} />
			<PaginationControls pagination={pagination} className="mt-4" />
		</div>
	);
}
