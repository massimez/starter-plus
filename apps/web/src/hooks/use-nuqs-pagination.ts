import { parseAsInteger, useQueryState } from "nuqs";

import { useState } from "react";

export const paginationPageParser = parseAsInteger.withDefault(1);

interface UseNuqsPaginationOptions {
	limit?: number;
	defaultTotal?: number;
}

export function useNuqsPagination({
	limit = 10,
	defaultTotal = 0,
}: UseNuqsPaginationOptions = {}) {
	const [page, setPage] = useQueryState("page", paginationPageParser);
	const [total, setTotal] = useState(defaultTotal);

	const totalPages = Math.ceil(total / limit);
	const offset = ((page || 1) - 1) * limit;

	return {
		page: page || 1,
		limit,
		offset,
		total,
		totalPages,
		hasNextPage: (page || 1) < totalPages,
		hasPreviousPage: (page || 1) > 1,
		nextPage: () => setPage((p) => Math.min(totalPages, (p ?? 1) + 1)),
		previousPage: () => setPage((p) => Math.max(1, (p ?? 1) - 1)),
		goToPage: (p: number) => setPage(p),
		setPage: (p: number) => setPage(p),
		setTotal: (newTotal: number) => {
			setTotal(newTotal);
			const newTotalPages = Math.ceil(newTotal / limit);
			if ((page || 1) > newTotalPages && newTotal > 0) {
				setPage(1);
			}
		},
	};
}
