import { createRouter } from "@/lib/create-hono-app";
import {
	createErrorResponse,
	createSuccessResponse,
	handleRouteError,
} from "@/lib/utils/route-helpers";
import {
	idParamSchema,
	jsonValidator,
	paramValidator,
	validateOrgId,
} from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import { hasOrgPermission } from "@/middleware/org-permission";
import {
	createReward,
	deleteReward,
	listRewards,
	updateReward,
} from "../reward.service";
import { createRewardSchema, updateRewardSchema } from "../schema";

export const rewardRoute = createRouter()
	/**
	 * POST /rewards
	 * Create a new reward
	 */
	.post(
		"/rewards",
		authMiddleware,
		hasOrgPermission("rewards:write"),
		jsonValidator(createRewardSchema),
		async (c) => {
			try {
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const payload = c.req.valid("json");

				const reward = await createReward({
					...payload,
					organizationId,
					validFrom: payload.validFrom
						? new Date(payload.validFrom)
						: undefined,
					validUntil: payload.validUntil
						? new Date(payload.validUntil)
						: undefined,
				});

				return c.json(
					createSuccessResponse(reward, "Reward created successfully"),
					201,
				);
			} catch (error) {
				return handleRouteError(c, error, "create reward");
			}
		},
	)

	/**
	 * GET /rewards
	 * List all rewards for a program
	 */
	.get(
		"/rewards",
		authMiddleware,
		hasOrgPermission("rewards:read"),
		async (c) => {
			try {
				const bonusProgramId = c.req.query("bonusProgramId");

				if (!bonusProgramId) {
					return c.json(
						createErrorResponse(
							"ValidationError",
							"bonusProgramId is required",
							[
								{
									code: "REQUIRED",
									path: ["bonusProgramId"],
									message: "bonusProgramId query parameter is required",
								},
							],
						),
						400,
					);
				}

				const rewards = await listRewards(bonusProgramId);

				return c.json(createSuccessResponse({ rewards }));
			} catch (error) {
				return handleRouteError(c, error, "fetch rewards");
			}
		},
	)

	/**
	 * PATCH /rewards/:id
	 * Update a reward
	 */
	.patch(
		"/rewards/:id",
		authMiddleware,
		hasOrgPermission("rewards:write"),
		paramValidator(idParamSchema),
		jsonValidator(updateRewardSchema),
		async (c) => {
			try {
				const { id } = c.req.valid("param");
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const payload = c.req.valid("json");

				const updated = await updateReward(id, organizationId, {
					...payload,
					validFrom: payload.validFrom
						? new Date(payload.validFrom)
						: undefined,
					validUntil: payload.validUntil
						? new Date(payload.validUntil)
						: undefined,
				});

				if (!updated) {
					return c.json(
						createErrorResponse("NotFoundError", "Reward not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No reward found with the provided id",
							},
						]),
						404,
					);
				}

				return c.json(
					createSuccessResponse(updated, "Reward updated successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "update reward");
			}
		},
	)

	/**
	 * DELETE /rewards/:id
	 * Delete a reward
	 */
	.delete(
		"/rewards/:id",
		authMiddleware,
		hasOrgPermission("rewards:delete"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const { id } = c.req.valid("param");
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);

				const deleted = await deleteReward(id, organizationId);

				if (!deleted) {
					return c.json(
						createErrorResponse("NotFoundError", "Reward not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No reward found with the provided id",
							},
						]),
						404,
					);
				}

				return c.json(
					createSuccessResponse(deleted, "Reward deleted successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "delete reward");
			}
		},
	);
