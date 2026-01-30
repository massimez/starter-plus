import { and, eq, isNull } from "drizzle-orm";
import type z from "zod";
import { db } from "@/lib/db";
import { address, location } from "@/lib/db/schema";
import { getAuditData } from "@/lib/utils/audit";
import type { insertLocationSchema, updateLocationSchema } from "./schema";

type LocationType = typeof location.$inferSelect;

type InsertLocationData = z.infer<typeof insertLocationSchema>;

type UpdateLocationData = z.infer<typeof updateLocationSchema>;

const selectLocationWithAddress = {
	id: location.id,
	organizationId: location.organizationId,
	locationType: location.locationType,
	name: location.name,
	description: location.description,
	capacity: location.capacity,
	isActive: location.isActive,
	isDefault: location.isDefault,
	metadata: location.metadata,
	createdAt: location.createdAt,
	updatedAt: location.updatedAt,
	deletedAt: location.deletedAt,
	createdBy: location.createdBy,
	updatedBy: location.updatedBy,
	address: {
		street: address.street,
		city: address.city,
		state: address.state,
		zipCode: address.zipCode,
		country: address.country,
		office: address.office,
		building: address.building,
		latitude: address.latitude,
		longitude: address.longitude,
	},
};

export async function createLocation(
	data: InsertLocationData,
	user: { id: string },
) {
	let addressId = data.addressId;
	if (data.address) {
		const [newAddress] = await db
			.insert(address)
			.values(data.address)
			.returning({ id: address.id });
		addressId = newAddress.id;
	}
	const insertData = {
		...data,
		addressId,
		...getAuditData(user, "create"),
	};
	delete insertData.address;

	const [insertedLocation] = await db
		.insert(location)
		.values(insertData)
		.returning({ id: location.id });

	// Fetch the created location with address
	const [newLocation] = await db
		.select(selectLocationWithAddress)
		.from(location)
		.leftJoin(address, eq(location.addressId, address.id))
		.where(eq(location.id, insertedLocation.id))
		.limit(1);

	return newLocation;
}

export async function getLocationsByOrg(organizationId: string) {
	const foundLocations = await db
		.select(selectLocationWithAddress)
		.from(location)
		.leftJoin(address, eq(location.addressId, address.id))

		.where(
			and(
				eq(location.organizationId, organizationId),
				isNull(location.deletedAt),
			),
		);

	return foundLocations;
}

export async function getLocationById(id: string, organizationId: string) {
	const foundLocations = await db
		.select(selectLocationWithAddress)
		.from(location)
		.leftJoin(address, eq(location.addressId, address.id))
		.where(
			and(
				eq(location.id, id),
				eq(location.organizationId, organizationId),
				isNull(location.deletedAt),
			),
		)
		.limit(1);

	return foundLocations[0] || null;
}

export async function updateLocation(
	id: string,
	data: UpdateLocationData,
	organizationId: string,
	user: { id: string },
) {
	let addressId = data.addressId;
	if (data.address) {
		if (addressId) {
			await db
				.update(address)
				.set(data.address)
				.where(eq(address.id, addressId));
		} else {
			const [newAddress] = await db
				.insert(address)
				.values(data.address)
				.returning({ id: address.id });
			addressId = newAddress.id;
		}
	}
	const updateData = {
		...data,
		addressId,
		organizationId,
		...getAuditData(user, "update"),
	};
	delete updateData.address;

	await db
		.update(location)
		.set(updateData)
		.where(
			and(eq(location.id, id), eq(location.organizationId, organizationId)),
		);

	// Fetch the updated location with address
	const [updatedLocation] = await db
		.select(selectLocationWithAddress)
		.from(location)
		.leftJoin(address, eq(location.addressId, address.id))
		.where(
			and(eq(location.id, id), eq(location.organizationId, organizationId)),
		)
		.limit(1);

	return updatedLocation || null;
}

export async function deleteLocation(
	id: string,
	organizationId: string,
	user: { id: string },
): Promise<LocationType | undefined> {
	const [deletedLocation] = await db
		.update(location)
		.set({
			...getAuditData(user, "delete"),
		})
		.where(
			and(eq(location.id, id), eq(location.organizationId, organizationId)),
		)
		.returning();

	return deletedLocation;
}
