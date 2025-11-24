import { and, eq, isNull } from "drizzle-orm";
import type { z } from "zod";
import { withPaginationAndTotal } from "@/helpers/pagination";
import { db } from "@/lib/db";
import { shippingMethod } from "@/lib/db/schema";
import { validateOrgId } from "@/lib/utils/validator";
import type { offsetPaginationSchema } from "@/middleware/pagination";
import type {
	insertShippingMethodSchema,
	updateShippingMethodSchema,
} from "./schema";

type OffsetPaginationParams = z.infer<typeof offsetPaginationSchema>;
type InsertShippingMethod = z.infer<typeof insertShippingMethodSchema>;
type UpdateShippingMethod = z.infer<typeof updateShippingMethodSchema>;

/**
 * Create a new shipping method
 */
export async function createShippingMethod(
	shippingMethodData: InsertShippingMethod,
	orgId: string,
) {
	const [newShippingMethod] = await db
		.insert(shippingMethod)
		.values({
			...shippingMethodData,
			organizationId: orgId,
		})
		.returning();
	return newShippingMethod;
}

/**
 * Get shipping methods with pagination
 */
export async function getShippingMethods(
	paginationParams: OffsetPaginationParams,
	orgId: string,
) {
	const result = await withPaginationAndTotal({
		db: db,
		query: db
			.select()
			.from(shippingMethod)
			.where(isNull(shippingMethod.deletedAt)),
		table: shippingMethod,
		params: paginationParams,
		orgId: orgId,
	});

	return { total: result.total, data: result.data };
}

/**
 * Get a single shipping method by ID
 */
export async function getShippingMethod(
	shippingMethodId: string,
	orgId: string,
) {
	const [foundShippingMethod] = await db
		.select()
		.from(shippingMethod)
		.where(
			and(
				eq(shippingMethod.id, shippingMethodId),
				eq(shippingMethod.organizationId, validateOrgId(orgId)),
				isNull(shippingMethod.deletedAt),
			),
		)
		.limit(1);
	return foundShippingMethod;
}

/**
 * Update a shipping method
 */
export async function updateShippingMethod(
	shippingMethodId: string,
	shippingMethodData: UpdateShippingMethod,
	orgId: string,
) {
	const [updatedShippingMethod] = await db
		.update(shippingMethod)
		.set(shippingMethodData)
		.where(
			and(
				eq(shippingMethod.id, shippingMethodId),
				eq(shippingMethod.organizationId, validateOrgId(orgId)),
				isNull(shippingMethod.deletedAt),
			),
		)
		.returning();
	return updatedShippingMethod;
}

/**
 * Delete a shipping method (soft delete)
 */
export async function deleteShippingMethod(
	shippingMethodId: string,
	orgId: string,
) {
	const [deletedShippingMethod] = await db
		.update(shippingMethod)
		.set({ deletedAt: new Date() })
		.where(
			and(
				eq(shippingMethod.id, shippingMethodId),
				eq(shippingMethod.organizationId, validateOrgId(orgId)),
				isNull(shippingMethod.deletedAt),
			),
		)
		.returning();
	return deletedShippingMethod;
}
