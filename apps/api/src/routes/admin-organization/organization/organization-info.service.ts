import { and, eq } from "drizzle-orm";
import type z from "zod";
import { db } from "@/lib/db";
import { address, location, organizationInfo } from "@/lib/db/schema";
import { getAuditData } from "@/lib/utils/audit";
import type {
	insertOrganizationInfoSchema,
	updateOrganizationInfoSchema,
} from "./schema";

type OrganizationInfoType = typeof organizationInfo.$inferSelect;
type InsertOrganizationInfoData = z.infer<typeof insertOrganizationInfoSchema>;
type UpdateOrganizationInfoData = z.infer<typeof updateOrganizationInfoSchema>;

export async function createOrganizationInfo(
	data: InsertOrganizationInfoData,
	user: { id: string },
) {
	const [newOrganizationInfo] = await db
		.insert(organizationInfo)
		.values({
			...data,
			...getAuditData(user, "create"),
		})
		.returning();
	return newOrganizationInfo;
}

export async function getOrganizationInfo(organizationId: string) {
	const foundOrganizationInfo = await db.query.organizationInfo.findFirst({
		where: (organizationInfo, { eq }) =>
			eq(organizationInfo.organizationId, organizationId),
	});
	return foundOrganizationInfo;
}

export async function getOrganizationInfoById(
	id: string,
	organizationId: string,
) {
	const foundOrganizationInfo = await db
		.select()
		.from(organizationInfo)
		.where(
			and(
				eq(organizationInfo.id, id),
				eq(organizationInfo.organizationId, organizationId),
			),
		)
		.limit(1);
	return foundOrganizationInfo[0] || null;
}

export async function updateOrganizationInfo(
	id: string,
	data: UpdateOrganizationInfoData,
	organizationId: string,
	user: { id: string },
) {
	const updatedOrganizationInfo = await db
		.update(organizationInfo)
		.set({
			...data,
			...getAuditData(user, "update"),
		})
		.where(
			and(
				eq(organizationInfo.id, id),
				eq(organizationInfo.organizationId, organizationId),
			),
		)
		.returning();
	return updatedOrganizationInfo[0] || null;
}

export async function deleteOrganizationInfo(
	id: string,
	organizationId: string,
): Promise<OrganizationInfoType | undefined> {
	const [deletedOrganizationInfo] = await db
		.delete(organizationInfo)
		.where(
			and(
				eq(organizationInfo.id, id),
				eq(organizationInfo.organizationId, organizationId),
			),
		)
		.returning();
	return deletedOrganizationInfo;
}

export async function getOrganizationBasicInfoBySlug(orgSlug: string) {
	const foundOrganization = await db.query.organization.findFirst({
		where: (organization, { eq }) => eq(organization.slug, orgSlug),
		columns: {
			id: true,
			name: true,
			slug: true,
			logo: true,
		},
	});

	if (!foundOrganization) {
		return null;
	}

	const foundOrganizationInfo = await db.query.organizationInfo.findFirst({
		where: (organizationInfo, { eq }) =>
			eq(organizationInfo.organizationId, foundOrganization.id),
		columns: {
			contactName: true,
			contactEmail: true,
			contactPhone: true,
			travelFeeType: true,
			travelFeeValue: true,
			travelFeeValueByKm: true,
			maxTravelDistance: true,
			travelFeesPolicyText: true,
			minimumTravelFees: true,
			taxRate: true,
			defaultLanguage: true,
			activeLanguages: true,
			images: true,
			socialLinks: true,
			seoMetadata: true,
		},
	});

	const defaultLocationResult = await db
		.select({
			name: location.name,
			metadata: location.metadata,
			description: location.description,
			isActive: location.isActive,
			locationType: location.locationType,
			isDefault: location.isDefault,
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
		})
		.from(location)
		.leftJoin(address, eq(location.addressId, address.id))
		.where(
			and(
				eq(location.organizationId, foundOrganization.id),
				eq(location.isDefault, true),
			),
		)
		.limit(1);

	const defaultLocation = defaultLocationResult[0] || null;

	return {
		...foundOrganization,
		defaultLocation,
		info: foundOrganizationInfo || null,
	};
}
