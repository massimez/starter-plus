import z from "zod";
import { createRouter } from "@/lib/create-hono-app";
import { handleRouteError } from "@/lib/utils/route-helpers";
import { jsonValidator, paramValidator } from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import { hasOrgPermission } from "@/middleware/org-permission";
import {
	createOrganizationInfo,
	deleteOrganizationInfo,
	getOrganizationBasicInfoBySlug,
	getOrganizationInfo,
	getOrganizationInfoById,
	updateOrganizationInfo,
} from "./organization-info.service";
import {
	insertOrganizationInfoSchema,
	updateOrganizationInfoSchema,
} from "./schema";

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

				const newOrganizationInfo = await createOrganizationInfo(insertData);

				return c.json(newOrganizationInfo, 201);
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

				const foundOrganizationInfo = await getOrganizationInfo(activeOrgId);

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

				const foundOrganizationInfo = await getOrganizationInfoById(
					id,
					activeOrgId,
				);

				if (!foundOrganizationInfo) {
					return c.json({ error: "Organization info not found" }, 404);
				}

				return c.json(foundOrganizationInfo);
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

				const updatedOrganizationInfo = await updateOrganizationInfo(
					id,
					data,
					activeOrgId,
				);

				if (!updatedOrganizationInfo) {
					return c.json({ error: "Organization info not found" }, 404);
				}

				return c.json(updatedOrganizationInfo);
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

				const deletedOrganizationInfo = await deleteOrganizationInfo(
					id,
					activeOrgId,
				);

				if (!deletedOrganizationInfo) {
					return c.json({ error: "Organization info not found" }, 404);
				}

				return c.json({
					message: "Organization info deleted successfully",
					deletedOrganizationInfo,
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

				const foundOrganization = await getOrganizationBasicInfoBySlug(orgSlug);

				if (!foundOrganization) {
					return c.json({ error: "Organization not found" }, 404);
				}

				return c.json(foundOrganization);
			} catch (error) {
				return handleRouteError(
					c,
					error,
					"fetch organization basic info by slug",
				);
			}
		},
	);
