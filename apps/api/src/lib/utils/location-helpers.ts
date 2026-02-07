import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { location } from "@/lib/db/schema";

/**
 * Get the default location for an organization
 * Returns the location marked as default, or the first active location if no default is set
 */
export async function getDefaultLocation(organizationId: string) {
	// Try to get the default location
	const defaultLocation = await db.query.location.findFirst({
		where: and(
			eq(location.organizationId, organizationId),
			eq(location.isDefault, true),
			eq(location.isActive, true),
			isNull(location.deletedAt),
		),
	});

	if (defaultLocation) {
		return defaultLocation;
	}

	// If no default location, get the first active location
	const firstActiveLocation = await db.query.location.findFirst({
		where: and(
			eq(location.organizationId, organizationId),
			eq(location.isActive, true),
			isNull(location.deletedAt),
		),
	});

	return firstActiveLocation || null;
}

/**
 * Set a location as the default for an organization
 * This will unset any other default locations for the same organization
 */
export async function setDefaultLocation(
	organizationId: string,
	locationId: string,
) {
	return await db.transaction(async (tx) => {
		// Unset all other default locations for this organization
		await tx
			.update(location)
			.set({ isDefault: false })
			.where(
				and(
					eq(location.organizationId, organizationId),
					eq(location.isDefault, true),
				),
			);

		// Set the new default location
		const [updatedLocation] = await tx
			.update(location)
			.set({ isDefault: true })
			.where(
				and(
					eq(location.id, locationId),
					eq(location.organizationId, organizationId),
				),
			)
			.returning();

		return updatedLocation;
	});
}
