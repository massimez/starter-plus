import { and, eq, isNull } from "drizzle-orm";
import type { z } from "zod";
import { withPaginationAndTotal } from "@/helpers/pagination";
import { db } from "@/lib/db";
import { shippingMethodZone } from "@/lib/db/schema";
import { getAuditData } from "@/lib/utils/audit";
import { validateOrgId } from "@/lib/utils/validator";
import type { offsetPaginationSchema } from "@/middleware/pagination";
import type {
	insertShippingMethodZoneSchema,
	updateShippingMethodZoneSchema,
} from "./schema";

type OffsetPaginationParams = z.infer<typeof offsetPaginationSchema>;
type InsertShippingMethodZone = z.infer<typeof insertShippingMethodZoneSchema>;
type UpdateShippingMethodZone = z.infer<typeof updateShippingMethodZoneSchema>;

/**
 * Create a new shipping method zone mapping
 */
export async function createShippingMethodZone(
	shippingMethodZoneData: InsertShippingMethodZone,
	orgId: string,
	user: { id: string },
) {
	const [newShippingMethodZone] = await db
		.insert(shippingMethodZone)
		.values({
			...shippingMethodZoneData,
			organizationId: orgId,
			...getAuditData(user, "create"),
		})
		.returning();
	return newShippingMethodZone;
}

/**
 * Get shipping method zones with pagination
 */
export async function getShippingMethodZones(
	paginationParams: OffsetPaginationParams,
	orgId: string,
) {
	const result = await withPaginationAndTotal({
		db: db,
		query: db
			.select()
			.from(shippingMethodZone)
			.where(isNull(shippingMethodZone.deletedAt)),
		table: shippingMethodZone,
		params: paginationParams,
		orgId: orgId,
	});

	return { total: result.total, data: result.data };
}

/**
 * Get shipping method zones by shipping method ID
 */
export async function getShippingMethodZonesByMethodId(
	shippingMethodId: string,
	orgId: string,
) {
	const zones = await db
		.select()
		.from(shippingMethodZone)
		.where(
			and(
				eq(shippingMethodZone.shippingMethodId, shippingMethodId),
				eq(shippingMethodZone.organizationId, validateOrgId(orgId)),
				isNull(shippingMethodZone.deletedAt),
			),
		);
	return zones;
}

/**
 * Get shipping method zones by zone ID
 */
export async function getShippingMethodZonesByZoneId(
	shippingZoneId: string,
	orgId: string,
) {
	const methods = await db
		.select()
		.from(shippingMethodZone)
		.where(
			and(
				eq(shippingMethodZone.shippingZoneId, shippingZoneId),
				eq(shippingMethodZone.organizationId, validateOrgId(orgId)),
				isNull(shippingMethodZone.deletedAt),
			),
		);
	return methods;
}

/**
 * Get a single shipping method zone by ID
 */
export async function getShippingMethodZone(
	shippingMethodZoneId: string,
	orgId: string,
) {
	const [foundShippingMethodZone] = await db
		.select()
		.from(shippingMethodZone)
		.where(
			and(
				eq(shippingMethodZone.id, shippingMethodZoneId),
				eq(shippingMethodZone.organizationId, validateOrgId(orgId)),
				isNull(shippingMethodZone.deletedAt),
			),
		)
		.limit(1);
	return foundShippingMethodZone;
}

/**
 * Update a shipping method zone
 */
export async function updateShippingMethodZone(
	shippingMethodZoneId: string,
	shippingMethodZoneData: UpdateShippingMethodZone,
	orgId: string,
	user: { id: string },
) {
	const [updatedShippingMethodZone] = await db
		.update(shippingMethodZone)
		.set({
			...shippingMethodZoneData,
			...getAuditData(user, "update"),
		})
		.where(
			and(
				eq(shippingMethodZone.id, shippingMethodZoneId),
				eq(shippingMethodZone.organizationId, validateOrgId(orgId)),
				isNull(shippingMethodZone.deletedAt),
			),
		)
		.returning();
	return updatedShippingMethodZone;
}

/**
 * Delete a shipping method zone (soft delete)
 */
export async function deleteShippingMethodZone(
	shippingMethodZoneId: string,
	orgId: string,
	user: { id: string },
) {
	const [deletedShippingMethodZone] = await db
		.update(shippingMethodZone)
		.set({
			...getAuditData(user, "delete"),
		})
		.where(
			and(
				eq(shippingMethodZone.id, shippingMethodZoneId),
				eq(shippingMethodZone.organizationId, validateOrgId(orgId)),
				isNull(shippingMethodZone.deletedAt),
			),
		)
		.returning();
	return deletedShippingMethodZone;
}
