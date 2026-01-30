import z from "zod";
import type { User } from "@/lib/auth";
import { createRouter } from "@/lib/create-hono-app";
import {
	createErrorResponse,
	createSuccessResponse,
	handleRouteError,
} from "@/lib/utils/route-helpers";
import { jsonValidator, paramValidator } from "@/lib/utils/validator";
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
		hasOrgPermission("organization:create"),
		jsonValidator(insertOrganizationInfoSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const user = c.get("user") as User;
				const data = c.req.valid("json");
				const insertData = { ...data, organizationId: activeOrgId };

				const newOrganizationInfo = await createOrganizationInfo(
					insertData,
					user,
				);

				return c.json(createSuccessResponse(newOrganizationInfo), 201);
			} catch (error) {
				return handleRouteError(c, error, "create organization info");
			}
		},
	)
	.get("/info", hasOrgPermission("organization:read"), async (c) => {
		try {
			const activeOrgId = c.get("session")?.activeOrganizationId as string;

			if (!activeOrgId) {
				return c.json(
					createErrorResponse(
						"BadRequestError",
						"No active organization found in session",
						[
							{
								code: "SESSION_ERROR",
								path: ["session"],
								message:
									"Active organization ID is required for this operation",
							},
						],
					),
					400,
				);
			}

			const foundOrganizationInfo = await getOrganizationInfo(activeOrgId);

			return c.json(createSuccessResponse(foundOrganizationInfo));
		} catch (error) {
			return handleRouteError(c, error, "fetch organization info");
		}
	})
	.get(
		"/info/:id",
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
					return c.json(
						createErrorResponse(
							"NotFoundError",
							"Organization info not found",
							[
								{
									code: "RESOURCE_NOT_FOUND",
									path: ["id"],
									message: "No organization info found with the provided id",
								},
							],
						),
						404,
					);
				}

				return c.json(createSuccessResponse(foundOrganizationInfo));
			} catch (error) {
				return handleRouteError(c, error, "fetch organization info");
			}
		},
	)
	.put(
		"/info/:id",
		hasOrgPermission("organization:update"),
		jsonValidator(updateOrganizationInfoSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const user = c.get("user") as User;
				const id = c.req.param("id");
				const data = c.req.valid("json");
				console.log("Updating organization info with data:", data);

				const updatedOrganizationInfo = await updateOrganizationInfo(
					id,
					data,
					activeOrgId,
					user,
				);

				if (!updatedOrganizationInfo) {
					return c.json(
						createErrorResponse(
							"NotFoundError",
							"Organization info not found",
							[
								{
									code: "RESOURCE_NOT_FOUND",
									path: ["id"],
									message: "No organization info found with the provided id",
								},
							],
						),
						404,
					);
				}

				return c.json(createSuccessResponse(updatedOrganizationInfo));
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
					return c.json(
						createErrorResponse(
							"NotFoundError",
							"Organization info not found",
							[
								{
									code: "RESOURCE_NOT_FOUND",
									path: ["id"],
									message: "No organization info found with the provided id",
								},
							],
						),
						404,
					);
				}

				return c.json(
					createSuccessResponse(
						deletedOrganizationInfo,
						"Organization info deleted successfully",
					),
				);
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
					return c.json(
						createErrorResponse("NotFoundError", "Organization not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["orgSlug"],
								message: "No organization found with the provided slug",
							},
						]),
						404,
					);
				}

				return c.json(createSuccessResponse(foundOrganization));
			} catch (error) {
				return handleRouteError(
					c,
					error,
					"fetch organization basic info by slug",
				);
			}
		},
	);
