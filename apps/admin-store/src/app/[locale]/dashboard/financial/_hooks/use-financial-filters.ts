"use client";

import { useQueryState } from "nuqs";
import { financialSearchParams } from "../_components/financial-search-params";

export function useFinancialFilters(onFilterChange?: () => void) {
	const [status, setStatus] = useQueryState(
		"status",
		financialSearchParams.status,
	);
	const [from, setFrom] = useQueryState("from", financialSearchParams.from);
	const [to, setTo] = useQueryState("to", financialSearchParams.to);
	const [categoryId, setCategoryId] = useQueryState(
		"categoryId",
		financialSearchParams.categoryId,
	);

	const handleFilterChange = (
		updater: (val: string | null) => void,
		value: string | null,
	) => {
		updater(value);
		onFilterChange?.();
	};

	const clearFilters = () => {
		setStatus(null);
		setFrom(null);
		setTo(null);
		setCategoryId(null);
		onFilterChange?.();
	};

	const hasActiveFilters = !!(status || from || to || categoryId);

	return {
		status,
		setStatus: (val: string | null) => handleFilterChange(setStatus, val),
		from,
		setFrom: (val: string | null) => handleFilterChange(setFrom, val),
		to,
		setTo: (val: string | null) => handleFilterChange(setTo, val),
		categoryId,
		setCategoryId: (val: string | null) =>
			handleFilterChange(setCategoryId, val),
		clearFilters,
		hasActiveFilters,
	};
}
