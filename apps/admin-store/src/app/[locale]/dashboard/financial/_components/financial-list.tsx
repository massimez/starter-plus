"use client";

import { PaginationControls } from "@workspace/ui/components/pagination-controls";
import { useNuqsPagination } from "@/hooks/use-nuqs-pagination";
import { useFinancialFilters } from "../_hooks/use-financial-filters";
import { useInvoices } from "../_hooks/use-invoices";
import { FinancialFilterBar } from "./financial-filter-bar";

interface FinancialListProps<T> {
	type: "receivable" | "payable";
	table: React.ComponentType<{ data: T[]; isLoading: boolean }>;
}

export function FinancialList<T>({
	type,
	table: Table,
}: FinancialListProps<T>) {
	const pagination = useNuqsPagination();
	const filters = useFinancialFilters(() => pagination.setPage(1));

	const { data: result, isLoading } = useInvoices(type, {
		limit: pagination.limit.toString(),
		offset: pagination.offset.toString(),
		status: filters.status,
		from: filters.from,
		to: filters.to,
		setTotal: pagination.setTotal,
	});

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
			/>

			<Table data={data} isLoading={isLoading} />
			<PaginationControls pagination={pagination} className="mt-4" />
		</div>
	);
}
