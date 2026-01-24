import { createRouter } from "@/lib/create-hono-app";
import { getDefaultLocation } from "@/lib/utils/location-helpers";
import {
	createSuccessResponse,
	handleRouteError,
} from "@/lib/utils/route-helpers";

export const locationRoutes = createRouter().get(
	"/default",

	async (c) => {
		try {
			const organizationId = c.var.tenantId;
			if (!organizationId) throw new Error("Organization ID required");
			const location = await getDefaultLocation(organizationId);

			if (!location) {
				return c.json(
					{
						success: false,
						error: {
							message: "No active location found for this organization",
						},
					},
					404,
				);
			}

			return c.json(createSuccessResponse(location));
		} catch (error) {
			return handleRouteError(c, error, "fetch default location");
		}
	},
);
