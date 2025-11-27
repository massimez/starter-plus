import { useCallback, useMemo, useState } from "react";

export interface UsePaginationOptions {
	initialPage?: number;
	limit?: number;
	total?: number;
}

export interface UsePaginationReturn {
	page: number;
	limit: number;
	offset: number;
	total: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	nextPage: () => void;
	previousPage: () => void;
	goToPage: (page: number) => void;
	setPage: (page: number) => void;
	setTotal: (total: number) => void;
}

export function usePagination({
	initialPage = 1,
	limit = 10,
	total: initialTotal = 0,
}: UsePaginationOptions): UsePaginationReturn {
	const [page, setPage] = useState(initialPage);
	const [total, setTotal] = useState(initialTotal);

	const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);
	const offset = useMemo(() => (page - 1) * limit, [page, limit]);
	const hasNextPage = useMemo(() => page < totalPages, [page, totalPages]);
	const hasPreviousPage = useMemo(() => page > 1, [page]);

	const nextPage = useCallback(() => {
		setPage((p) => Math.min(totalPages, p + 1));
	}, [totalPages]);

	const previousPage = useCallback(() => {
		setPage((p) => Math.max(1, p - 1));
	}, []);

	const goToPage = useCallback(
		(newPage: number) => {
			const clampedPage = Math.max(1, Math.min(totalPages, newPage));
			setPage(clampedPage);
		},
		[totalPages],
	);

	const updateTotal = useCallback(
		(newTotal: number) => {
			setTotal(newTotal);
			// Reset to first page if current page exceeds new total pages
			const newTotalPages = Math.ceil(newTotal / limit);
			if (page > newTotalPages) {
				setPage(1);
			}
		},
		[page, limit],
	);

	return {
		page,
		limit,
		offset,
		total,
		totalPages,
		hasNextPage,
		hasPreviousPage,
		nextPage,
		previousPage,
		goToPage,
		setPage,
		setTotal: updateTotal,
	};
}
