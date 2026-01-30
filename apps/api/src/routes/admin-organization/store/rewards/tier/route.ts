import type { User } from "@/lib/auth";
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
import { hasOrgPermission } from "@/middleware/org-permission";
import { createTierSchema, updateTierSchema } from "../schema";
import {
	calculateUserTier,
	createTier,
	deleteTier,
	getTierBenefits,
	listTiers,
	updateTier,
} from "../tier.service";

export const tierRoute = createRouter()
	/**
	 * POST /tiers
	 * Create a new tier
	 */
	.post(
		"/tiers",
		hasOrgPermission("rewards:write"),
		jsonValidator(createTierSchema),
		async (c) => {
			try {
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const user = c.get("user") as User;
				const payload = c.req.valid("json");

				const tier = await createTier(
					{
						...payload,
						organizationId,
					},
					user,
				);

				return c.json(
					createSuccessResponse(tier, "Tier created successfully"),
					201,
				);
			} catch (error) {
				return handleRouteError(c, error, "create tier");
			}
		},
	)

	/**
	 * GET /tiers
	 * List all tiers for a program
	 */
	.get("/tiers", hasOrgPermission("rewards:read"), async (c) => {
		try {
			const bonusProgramId = c.req.query("bonusProgramId");

			if (!bonusProgramId) {
				return c.json(
					createErrorResponse("ValidationError", "bonusProgramId is required", [
						{
							code: "REQUIRED",
							path: ["bonusProgramId"],
							message: "bonusProgramId query parameter is required",
						},
					]),
					400,
				);
			}

			const tiers = await listTiers(bonusProgramId);

			return c.json(createSuccessResponse({ tiers }));
		} catch (error) {
			return handleRouteError(c, error, "fetch tiers");
		}
	})

	/**
	 * PATCH /tiers/:id
	 * Update a tier
	 */
	.patch(
		"/tiers/:id",
		hasOrgPermission("rewards:write"),
		paramValidator(idParamSchema),
		jsonValidator(updateTierSchema),
		async (c) => {
			try {
				const { id } = c.req.valid("param");
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const user = c.get("user");
				if (!user) throw new Error("User not found in context");
				const payload = c.req.valid("json");

				const updated = await updateTier(id, organizationId, payload, user);

				if (!updated) {
					return c.json(
						createErrorResponse("NotFoundError", "Tier not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No tier found with the provided id",
							},
						]),
						404,
					);
				}

				return c.json(
					createSuccessResponse(updated, "Tier updated successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "update tier");
			}
		},
	)

	/**
	 * DELETE /tiers/:id
	 * Delete a tier
	 */
	.delete(
		"/tiers/:id",
		hasOrgPermission("rewards:delete"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const { id } = c.req.valid("param");
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const user = c.get("user");
				if (!user) throw new Error("User not found in context");

				const deleted = await deleteTier(id, organizationId, user);

				if (!deleted) {
					return c.json(
						createErrorResponse("NotFoundError", "Tier not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No tier found with the provided id",
							},
						]),
						404,
					);
				}

				return c.json(
					createSuccessResponse(deleted, "Tier deleted successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "delete tier");
			}
		},
	)

	/**
	 * GET /tiers/:id/benefits
	 * Get tier benefits
	 */
	.get(
		"/tiers/:id/benefits",
		hasOrgPermission("rewards:read"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const { id } = c.req.valid("param");

				const benefits = await getTierBenefits(id);

				return c.json(createSuccessResponse({ benefits }));
			} catch (error) {
				return handleRouteError(c, error, "fetch tier benefits");
			}
		},
	)

	/**
	 * GET /tiers/calculate-user-tier
	 * Calculate user's current tier
	 */
	.get(
		"/tiers/calculate-user-tier",
		hasOrgPermission("rewards:read"),
		async (c) => {
			try {
				const userId = c.req.query("userId");
				const bonusProgramId = c.req.query("bonusProgramId");

				if (!userId || !bonusProgramId) {
					return c.json(
						createErrorResponse(
							"ValidationError",
							"userId and bonusProgramId are required",
							[
								{
									code: "REQUIRED",
									path: ["userId", "bonusProgramId"],
									message: "Both userId and bonusProgramId are required",
								},
							],
						),
						400,
					);
				}

				const tierInfo = await calculateUserTier(userId, bonusProgramId);

				if (!tierInfo) {
					return c.json(
						createErrorResponse(
							"NotFoundError",
							"User bonus account not found",
							[
								{
									code: "RESOURCE_NOT_FOUND",
									path: ["userId"],
									message: "User has no bonus account for this program",
								},
							],
						),
						404,
					);
				}

				return c.json(createSuccessResponse(tierInfo));
			} catch (error) {
				return handleRouteError(c, error, "calculate user tier");
			}
		},
	);
