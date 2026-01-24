import { createRouter } from "@/lib/create-hono-app";
import {
	createSuccessResponse,
	handleRouteError,
} from "@/lib/utils/route-helpers";
import { getStorefrontCollections } from "./collections.service";

export const collectionsRoutes = createRouter().get(
	"/",

	async (c) => {
		try {
			const organizationId = c.var.tenantId;
			if (!organizationId) throw new Error("Organization ID required");

			const collections = await getStorefrontCollections({ organizationId });
			return c.json(createSuccessResponse(collections));
		} catch (error) {
			return handleRouteError(c, error, "fetch storefront collections");
		}
	},
);
