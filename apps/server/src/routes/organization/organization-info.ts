import { and, eq } from "drizzle-orm";
import z from "zod";
import { createRouter } from "@/lib/create-hono-app";
import { db } from "@/lib/db";
import { organizationInfo } from "@/lib/db/schema";
import { handleRouteError } from "@/lib/utils/route-helpers";
import { jsonValidator, paramValidator } from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import { hasOrgPermission } from "@/middleware/org-permission";
import {
	insertOrganizationInfoSchema,
	updateOrganizationInfoSchema,
} from "./schema";

const buildOrganizationInfoQuery = (id: string, orgId: string) =>
	and(eq(organizationInfo.id, id), eq(organizationInfo.organizationId, orgId));

export const organizationInfoRoute = createRouter()
	.post(
		"/info",
		authMiddleware,
		hasOrgPermission("organization:create"),
		jsonValidator(insertOrganizationInfoSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;

				const data = c.req.valid("json");
				const insertData = { ...data, organizationId: activeOrgId };

				const newOrganizationInfo = await db
					.insert(organizationInfo)
					.values(insertData)
					.returning();

				return c.json(newOrganizationInfo[0], 201);
			} catch (error) {
				return handleRouteError(c, error, "create organization info");
			}
		},
	)
	.get(
		"/info",
		authMiddleware,
		hasOrgPermission("organization:read"),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;

				if (!activeOrgId) {
					return c.json(
						{ error: "No active organization found in session" },
						400,
					);
				}

				const foundOrganizationInfo = await db.query.organizationInfo.findFirst(
					{
						where: (organizationInfo, { eq }) =>
							eq(organizationInfo.organizationId, activeOrgId),
					},
				);

				return c.json({
					data: foundOrganizationInfo,
				});
			} catch (error) {
				return handleRouteError(c, error, "fetch organization info");
			}
		},
	)
	.get(
		"/info/:id",
		authMiddleware,

		hasOrgPermission("organization:read"),
		paramValidator(
			z.object({
				id: z.string().min(1, "id is required"),
			}),
		),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;

				const id = c.req.param("id");

				const foundOrganizationInfo = await db
					.select()
					.from(organizationInfo)
					.where(buildOrganizationInfoQuery(id, activeOrgId))
					.limit(1);

				if (!foundOrganizationInfo.length) {
					return c.json({ error: "Organization info not found" }, 404);
				}

				return c.json(foundOrganizationInfo[0]);
			} catch (error) {
				return handleRouteError(c, error, "fetch organization info");
			}
		},
	)
	.put(
		"/info/:id",
		authMiddleware,

		hasOrgPermission("organization:update"),
		jsonValidator(updateOrganizationInfoSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;

				const id = c.req.param("id");
				const data = c.req.valid("json");
				console.log("Updating organization info with data:", data);

				const updatedOrganizationInfo = await db
					.update(organizationInfo)
					.set(data)
					.where(buildOrganizationInfoQuery(id, activeOrgId))
					.returning();

				if (!updatedOrganizationInfo.length) {
					return c.json({ error: "Organization info not found" }, 404);
				}

				return c.json(updatedOrganizationInfo[0]);
			} catch (error) {
				return handleRouteError(c, error, "update organization info");
			}
		},
	)
	.delete(
		"/info/:id",
		hasOrgPermission("organization_info:delete"),
		paramValidator(
			z.object({
				id: z.string().min(1, "id is required"),
			}),
		),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;

				const id = c.req.param("id");

				const deletedOrganizationInfo = await db
					.delete(organizationInfo)
					.where(buildOrganizationInfoQuery(id, activeOrgId))
					.returning();

				if (!deletedOrganizationInfo.length) {
					return c.json({ error: "Organization info not found" }, 404);
				}

				return c.json({
					message: "Organization info deleted successfully",
					deletedOrganizationInfo: deletedOrganizationInfo[0],
				});
			} catch (error) {
				return handleRouteError(c, error, "delete organization info");
			}
		},
	)
	.get(
		"/basic-info/:orgSlug",
		paramValidator(
			z.object({
				orgSlug: z.string().min(1, "orgSlug is required"),
			}),
		),
		async (c) => {
			try {
				const orgSlug = c.req.param("orgSlug");

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
					return c.json({ error: "Organization not found" }, 404);
				}

				const foundOrganizationInfo = await db.query.organizationInfo.findFirst(
					{
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
							bonusPercentage: true,
							defaultLanguage: true,
							activeLanguages: true,
							images: true,
							socialLinks: true,
						},
					},
				);

				const defaultLocation = await db.query.location.findFirst({
					where: (location, { eq, and }) =>
						and(
							eq(location.organizationId, foundOrganization.id),
							eq(location.isDefault, true),
						),
					columns: {
						name: true,
						metadata: true,
						description: true,
						isActive: true,
						address: true,
						locationType: true,
						latitude: true,
						longitude: true,
						isDefault: true,
					},
				});

				return c.json({
					...foundOrganization,
					...{ defaultLocation },
					...{ info: foundOrganizationInfo || null },
				});
			} catch (error) {
				return handleRouteError(
					c,
					error,
					"fetch organization basic info by slug",
				);
			}
		},
	);
