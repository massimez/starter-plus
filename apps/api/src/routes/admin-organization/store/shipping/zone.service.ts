import { and, eq, isNull } from "drizzle-orm";
import type { z } from "zod";
import { withPaginationAndTotal } from "@/helpers/pagination";
import { db } from "@/lib/db";
import { shippingZone } from "@/lib/db/schema";
import { getAuditData } from "@/lib/utils/audit";
import { validateOrgId } from "@/lib/utils/validator";
import type { offsetPaginationSchema } from "@/middleware/pagination";
import type {
	insertShippingZoneSchema,
	updateShippingZoneSchema,
} from "./schema";

type OffsetPaginationParams = z.infer<typeof offsetPaginationSchema>;
type InsertShippingZone = z.infer<typeof insertShippingZoneSchema>;
type UpdateShippingZone = z.infer<typeof updateShippingZoneSchema>;

/**
 * Create a new shipping zone
 */
export async function createShippingZone(
	shippingZoneData: InsertShippingZone,
	orgId: string,
	user: { id: string },
) {
	const [newShippingZone] = await db
		.insert(shippingZone)
		.values({
			...shippingZoneData,
			organizationId: orgId,
			...getAuditData(user, "create"),
		})
		.returning();
	return newShippingZone;
}

/**
 * Get shipping zones with pagination
 */
export async function getShippingZones(
	paginationParams: OffsetPaginationParams,
	orgId: string,
) {
	const result = await withPaginationAndTotal({
		db: db,
		query: db.select().from(shippingZone).where(isNull(shippingZone.deletedAt)),
		table: shippingZone,
		params: paginationParams,
		orgId: orgId,
	});

	return { total: result.total, data: result.data };
}

/**
 * Get a single shipping zone by ID
 */
export async function getShippingZone(shippingZoneId: string, orgId: string) {
	const [foundShippingZone] = await db
		.select()
		.from(shippingZone)
		.where(
			and(
				eq(shippingZone.id, shippingZoneId),
				eq(shippingZone.organizationId, validateOrgId(orgId)),
				isNull(shippingZone.deletedAt),
			),
		)
		.limit(1);
	return foundShippingZone;
}

/**
 * Update a shipping zone
 */
export async function updateShippingZone(
	shippingZoneId: string,
	shippingZoneData: UpdateShippingZone,
	orgId: string,
	user: { id: string },
) {
	const [updatedShippingZone] = await db
		.update(shippingZone)
		.set({
			...shippingZoneData,
			...getAuditData(user, "update"),
		})
		.where(
			and(
				eq(shippingZone.id, shippingZoneId),
				eq(shippingZone.organizationId, validateOrgId(orgId)),
				isNull(shippingZone.deletedAt),
			),
		)
		.returning();
	return updatedShippingZone;
}

/**
 * Delete a shipping zone (soft delete)
 */
export async function deleteShippingZone(
	shippingZoneId: string,
	orgId: string,
	user: { id: string },
) {
	const [deletedShippingZone] = await db
		.update(shippingZone)
		.set({
			...getAuditData(user, "delete"),
		})
		.where(
			and(
				eq(shippingZone.id, shippingZoneId),
				eq(shippingZone.organizationId, validateOrgId(orgId)),
				isNull(shippingZone.deletedAt),
			),
		)
		.returning();
	return deletedShippingZone;
}
