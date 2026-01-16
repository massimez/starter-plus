import {
	type AnyColumn,
	and,
	asc,
	type ColumnsSelection,
	count,
	desc,
	eq,
	getTableColumns,
	isNull,
	type SQL,
} from "drizzle-orm";
import type { PgSelect, PgTable } from "drizzle-orm/pg-core";
import type { OffsetPaginationParams } from "@/types/api";

// ============================================================================
// Types
// ============================================================================

interface BaseTable extends PgTable {
	organizationId: AnyColumn;
	deletedAt?: AnyColumn;
}

interface PaginationParams<T extends BaseTable> {
	// biome-ignore lint/suspicious/noExplicitAny: <>
	db: any;
	table: T;
	orgId: string;
	params: OffsetPaginationParams;
	// biome-ignore lint/suspicious/noExplicitAny: <>
	query?: any;
	baseFilters?: SQL;
}

interface PaginationResult<T> {
	data: T[];
	total: number;
}

// ============================================================================
// Main Pagination Function
// ============================================================================

export async function withPaginationAndTotal<
	T extends BaseTable,
	TQueryResult extends ColumnsSelection = T["$inferSelect"],
>(args: PaginationParams<T>): Promise<PaginationResult<TQueryResult>> {
	const { db, table, params, query, orgId, baseFilters: customFilters } = args;

	const filters = customFilters ?? buildDefaultFilters(table, orgId);

	const baseQuery = query
		? query.where(filters)
		: db.select().from(table).where(filters);

	const paginatedQuery = applyPagination(baseQuery, table, params);

	const countQuery = db.select({ count: count() }).from(table).where(filters);

	const [data, totalResult] = await Promise.all([paginatedQuery, countQuery]);

	return {
		data: data as TQueryResult[],
		total: Number(totalResult[0]?.count ?? 0),
	};
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Builds default filters for organization and soft deletes
 */
function buildDefaultFilters<T extends BaseTable>(
	table: T,
	orgId: string,
): SQL | undefined {
	const orgFilter = eq(table.organizationId, orgId);

	const softDeleteFilter =
		"deletedAt" in table && table.deletedAt
			? isNull(table.deletedAt)
			: undefined;

	return and(orgFilter, softDeleteFilter);
}

/**
 * Applies pagination and sorting to a query
 */
function applyPagination<T extends PgTable>(
	query: PgSelect,
	table: T,
	params: OffsetPaginationParams,
): PgSelect {
	const { limit, offset, orderBy, direction = "asc" } = params;

	let result = query.limit(limit).offset(offset);

	const columns = getTableColumns(table);

	if (orderBy) {
		const column = columns[orderBy as keyof typeof columns];

		if (column) {
			const sortOrder = direction === "desc" ? desc(column) : asc(column);
			result = result.orderBy(sortOrder);
		}
	} else if ("createdAt" in columns) {
		result = result.orderBy(desc(columns.createdAt as AnyColumn));
	}

	return result;
}
