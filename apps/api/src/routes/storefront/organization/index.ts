import { z } from "zod";
import { createRouter } from "@/lib/create-hono-app";
import {
	createErrorResponse,
	createSuccessResponse,
	handleRouteError,
} from "@/lib/utils/route-helpers";
import { queryValidator } from "@/lib/utils/validator";
import { getOrganizationBasicInfoBySlug } from "../../admin-organization/organization/organization-info.service";

export const organizationRoutes = createRouter().get(
	"/info",
	queryValidator(
		z.object({
			orgSlug: z.string().optional(),
		}),
	),
	async (c) => {
		try {
			const { orgSlug } = c.req.valid("query");

			let slug = orgSlug;

			if (!slug) {
				const organization = c.var.tenant;
				if (organization) {
					slug = organization.slug || undefined;
				}
			}

			if (!slug) {
				return c.json(
					createErrorResponse("BadRequest", "orgSlug is required", [
						{
							code: "MISSING_PARAM",
							path: ["orgSlug"],
							message: "orgSlug is required",
						},
					]),
					400,
				);
			}

			const info = await getOrganizationBasicInfoBySlug(slug);

			if (!info) {
				return c.json(
					createErrorResponse("NotFoundError", "Organization not found", [
						{
							code: "RESOURCE_NOT_FOUND",
							path: ["orgSlug"],
							message: "Organization not found",
						},
					]),
					404,
				);
			}

			return c.json(createSuccessResponse(info));
		} catch (error) {
			return handleRouteError(c, error, "fetch organization info");
		}
	},
);
