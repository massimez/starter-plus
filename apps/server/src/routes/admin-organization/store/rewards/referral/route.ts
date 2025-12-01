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
	getReferralStats,
	trackReferral,
	validateReferralCode,
} from "../referral.service";
import { validateReferralCodeSchema } from "../schema";

export const referralRoute = createRouter()
	/**
	 * POST /referrals/validate
	 * Validate a referral code
	 */
	.post(
		"/referrals/validate",
		authMiddleware,
		jsonValidator(validateReferralCodeSchema),
		async (c) => {
			try {
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { code } = c.req.valid("json");

				const referral = await validateReferralCode(code, organizationId);

				if (!referral || !referral.isActive) {
					return c.json(
						createErrorResponse(
							"NotFoundError",
							"Invalid or inactive referral code",
							[
								{
									code: "INVALID_REFERRAL_CODE",
									path: ["code"],
									message: "The referral code is invalid or no longer active",
								},
							],
						),
						404,
					);
				}

				return c.json(
					createSuccessResponse(
						{
							valid: true,
							referrerId: referral.referrerId,
							bonusProgramId: referral.bonusProgramId,
						},
						"Referral code is valid",
					),
				);
			} catch (error) {
				return handleRouteError(c, error, "validate referral code");
			}
		},
	)

	/**
	 * GET /referrals/stats/:userId
	 * Get referral statistics for a user
	 */
	.get(
		"/referrals/stats/:userId",
		authMiddleware,
		hasOrgPermission("rewards:read"),
		paramValidator(idParamSchema.extend({ userId: idParamSchema.shape.id })),
		async (c) => {
			try {
				const { userId } = c.req.valid("param");
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

				const stats = await getReferralStats(userId, bonusProgramId);

				return c.json(createSuccessResponse(stats));
			} catch (error) {
				return handleRouteError(c, error, "fetch referral stats");
			}
		},
	)

	/**
	 * POST /referrals/track
	 * Track a referral signup (admin endpoint)
	 */
	.post(
		"/referrals/track",
		authMiddleware,
		hasOrgPermission("rewards:write"),
		jsonValidator(
			validateReferralCodeSchema.extend({
				referredUserId: validateReferralCodeSchema.shape.code,
			}),
		),
		async (c) => {
			try {
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { code, referredUserId } = c.req.valid("json");

				const result = await trackReferral(
					code,
					referredUserId,
					organizationId,
				);

				if (!result) {
					return c.json(
						createErrorResponse("ValidationError", "Failed to track referral", [
							{
								code: "REFERRAL_TRACKING_FAILED",
								path: ["code"],
								message:
									"Unable to track referral. Code may be invalid or already used.",
							},
						]),
						400,
					);
				}

				return c.json(
					createSuccessResponse(result, "Referral tracked successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "track referral");
			}
		},
	);
