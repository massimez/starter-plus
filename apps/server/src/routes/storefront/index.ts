import z from "zod";
import { createRouter } from "@/lib/create-hono-app";
import {
	createErrorResponse,
	createSuccessResponse,
	handleRouteError,
} from "@/lib/utils/route-helpers";
import { paramValidator } from "@/lib/utils/validator";
import { getOrganizationBasicInfoBySlug } from "../admin-organization/organization/organization-info.service";

export const storefrontRoutes = createRouter().get(
	"/organizations/basic-info/:orgSlug",
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

export default storefrontRoutes;
