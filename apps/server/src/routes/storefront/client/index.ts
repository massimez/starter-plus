import { createRouter } from "@/lib/create-hono-app";
import {
	createErrorResponse,
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
				const activeOrgId = c.get("session")?.activeOrganizationId as string;

				if (!userId) {
					return c.json(
						createErrorResponse(
							"AuthenticationError",
							"User not authenticated",
							[
								{
									code: "USER_NOT_AUTHENTICATED",
									path: ["session"],
									message: "Valid user session required",
								},
							],
						),
						401,
					);
				}

				const clientProfile = await getMyClient(userId, activeOrgId);
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
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const updateData = c.req.valid("json");

				if (!userId) {
					return c.json(
						createErrorResponse(
							"AuthenticationError",
							"User not authenticated",
							[
								{
									code: "USER_NOT_AUTHENTICATED",
									path: ["session"],
									message: "Valid user session required",
								},
							],
						),
						401,
					);
				}

				const updatedProfile = await updateMyClient(
					userId,
					activeOrgId,
					updateData,
				);
				return c.json(createSuccessResponse(updatedProfile));
			} catch (error) {
				return handleRouteError(c, error, "update client profile");
			}
		},
	);

export default clientRoute;
