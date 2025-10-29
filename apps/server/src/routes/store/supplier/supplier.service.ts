import { and, eq, isNull } from "drizzle-orm";
import type { z } from "zod";
import { withPaginationAndTotal } from "@/helpers/pagination";
import { db } from "@/lib/db";
import { supplier } from "@/lib/db/schema";
import { validateOrgId } from "@/lib/utils/validator";
import type { offsetPaginationSchema } from "@/middleware/pagination";
import type { insertSupplierSchema, updateSupplierSchema } from "./schema";

type OffsetPaginationParams = z.infer<typeof offsetPaginationSchema>;
type InsertSupplier = z.infer<typeof insertSupplierSchema>;
type UpdateSupplier = z.infer<typeof updateSupplierSchema>;

/**
 * Create a new supplier
 */
export async function createSupplier(
	supplierData: InsertSupplier,
	orgId: string,
) {
	const [newSupplier] = await db
		.insert(supplier)
		.values({
			...supplierData,
			organizationId: orgId,
		})
		.returning();
	return newSupplier;
}

/**
 * Get suppliers with pagination
 */
export async function getSuppliers(
	paginationParams: OffsetPaginationParams,
	orgId: string,
) {
	const result = await withPaginationAndTotal({
		db: db,
		query: db.select().from(supplier).where(isNull(supplier.deletedAt)),
		table: supplier,
		params: paginationParams,
		orgId: orgId,
	});

	return { total: result.total, data: result.data };
}

/**
 * Get a single supplier by ID
 */
export async function getSupplier(supplierId: string, orgId: string) {
	const [foundSupplier] = await db
		.select()
		.from(supplier)
		.where(
			and(
				eq(supplier.id, supplierId),
				eq(supplier.organizationId, validateOrgId(orgId)),
				isNull(supplier.deletedAt),
			),
		)
		.limit(1);
	return foundSupplier;
}

/**
 * Update a supplier
 */
export async function updateSupplier(
	supplierId: string,
	supplierData: UpdateSupplier,
	orgId: string,
) {
	const [updatedSupplier] = await db
		.update(supplier)
		.set(supplierData)
		.where(
			and(
				eq(supplier.id, supplierId),
				eq(supplier.organizationId, validateOrgId(orgId)),
				isNull(supplier.deletedAt),
			),
		)
		.returning();
	return updatedSupplier;
}

/**
 * Delete a supplier (soft delete)
 */
export async function deleteSupplier(supplierId: string, orgId: string) {
	const [deletedSupplier] = await db
		.update(supplier)
		.set({ deletedAt: new Date() })
		.where(
			and(
				eq(supplier.id, supplierId),
				eq(supplier.organizationId, validateOrgId(orgId)),
				isNull(supplier.deletedAt),
			),
		)
		.returning();
	return deletedSupplier;
}
