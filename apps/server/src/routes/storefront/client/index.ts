import { createRouter } from "@/lib/create-hono-app";
import {
	createSuccessResponse,
	handleRouteError,
} from "@/lib/utils/route-helpers";
import { jsonValidator } from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import { rateLimiter } from "@/middleware/rate-limiter";

import { getMyClient, updateMyClient } from "./client.service";
import { storefrontUpdateClientSchema } from "./schema";

// --------------------
// Storefront Client Routes
// --------------------
export const clientRoute = createRouter()
	.get(
		"/me",
		authMiddleware,
		rateLimiter(60000, 100), // 100 requests per minute
		async (c) => {
			try {
				const userId = c.get("session")?.userId as string;
				// biome-ignore lint/style/noNonNullAssertion: <tenant middleware should set this>
				const organizationId = c.var.tenantId!;
				const clientProfile = await getMyClient(userId, organizationId);
				return c.json(createSuccessResponse(clientProfile));
			} catch (error) {
				return handleRouteError(c, error, "fetch client profile");
			}
		},
	)
	.put(
		"/me",
		authMiddleware,
		rateLimiter(60000, 20), // 20 requests per minute
		jsonValidator(storefrontUpdateClientSchema),
		async (c) => {
			try {
				const userId = c.get("session")?.userId as string;
				const updateData = c.req.valid("json");
				// biome-ignore lint/style/noNonNullAssertion: <tenant middleware should set this>
				const organizationId = c.var.tenantId!;

				const updatedProfile = await updateMyClient(
					userId,
					organizationId,
					updateData,
				);
				return c.json(createSuccessResponse(updatedProfile));
			} catch (error) {
				return handleRouteError(c, error, "update client profile");
			}
		},
	);

export default clientRoute;
