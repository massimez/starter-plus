import { and, eq, isNull } from "drizzle-orm";
import type { z } from "zod";
import { withPaginationAndTotal } from "@/helpers/pagination";
import { db } from "@/lib/db";
import { brand } from "@/lib/db/schema";
import { validateOrgId } from "@/lib/utils/validator";
import type { offsetPaginationSchema } from "@/middleware/pagination";
import type { insertBrandSchema, updateBrandSchema } from "./brand";

type OffsetPaginationParams = z.infer<typeof offsetPaginationSchema>;
type InsertBrand = z.infer<typeof insertBrandSchema>;
type UpdateBrand = z.infer<typeof updateBrandSchema>;

/**
 * Create a new brand
 */
export async function createBrand(brandData: InsertBrand, orgId: string) {
	const [newBrand] = await db
		.insert(brand)
		.values({
			...brandData,
			organizationId: orgId,
		})
		.returning();
	return newBrand;
}

/**
 * Get brands with pagination
 */
export async function getBrands(
	paginationParams: OffsetPaginationParams,
	orgId: string,
) {
	const result = await withPaginationAndTotal({
		db: db,
		query: db.select().from(brand).where(isNull(brand.deletedAt)),
		table: brand,
		params: paginationParams,
		orgId: orgId,
	});

	return { total: result.total, data: result.data };
}

/**
 * Get a single brand by ID
 */
export async function getBrand(brandId: string, orgId: string) {
	const [foundBrand] = await db
		.select()
		.from(brand)
		.where(
			and(
				eq(brand.id, brandId),
				eq(brand.organizationId, validateOrgId(orgId)),
				isNull(brand.deletedAt),
			),
		)
		.limit(1);
	return foundBrand;
}

/**
 * Update a brand
 */
export async function updateBrand(
	brandId: string,
	brandData: UpdateBrand,
	orgId: string,
) {
	const [updatedBrand] = await db
		.update(brand)
		.set(brandData)
		.where(
			and(
				eq(brand.id, brandId),
				eq(brand.organizationId, validateOrgId(orgId)),
				isNull(brand.deletedAt),
			),
		)
		.returning();
	return updatedBrand;
}

/**
 * Delete a brand (soft delete)
 */
export async function deleteBrand(brandId: string, orgId: string) {
	const [deletedBrand] = await db
		.update(brand)
		.set({ deletedAt: new Date() })
		.where(
			and(
				eq(brand.id, brandId),
				eq(brand.organizationId, validateOrgId(orgId)),
				isNull(brand.deletedAt),
			),
		)
		.returning();
	return deletedBrand;
}
