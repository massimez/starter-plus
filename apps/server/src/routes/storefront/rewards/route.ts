import { z } from "zod";
import { createRouter } from "@/lib/create-hono-app";
import {
	createErrorResponse,
	createSuccessResponse,
	handleRouteError,
} from "@/lib/utils/route-helpers";
import {
	jsonValidator,
	queryValidator,
	validateOrgId,
} from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import { getActiveBonusProgram } from "@/routes/admin-organization/store/rewards/bonus-program.service";
import {
	applyCoupon,
	getUserCoupons,
} from "@/routes/admin-organization/store/rewards/coupon.service";
import { getUserMilestones } from "@/routes/admin-organization/store/rewards/milestone.service";
import {
	getPointsBalance,
	getTransactionHistory,
} from "@/routes/admin-organization/store/rewards/points.service";
import {
	getOrCreateReferralCode,
	getReferralStats,
} from "@/routes/admin-organization/store/rewards/referral.service";
import {
	getAvailableRewards,
	redeemReward,
} from "@/routes/admin-organization/store/rewards/reward.service";
import {
	applyCouponSchema,
	redeemRewardSchema,
} from "@/routes/admin-organization/store/rewards/schema";
import { calculateUserTier } from "@/routes/admin-organization/store/rewards/tier.service";

const paginationSchema = z.object({
	limit: z.coerce.number().int().positive().max(100).optional().default(20),
	offset: z.coerce.number().int().min(0).optional().default(0),
});

export const storefrontRewardsRoute = createRouter()
	/**
	 * GET /api/storefront/rewards/balance
	 * Get user's points balance and tier info
	 */
	.get("/balance", authMiddleware, async (c) => {
		try {
			const organizationId = validateOrgId(c.var.tenantId || undefined);
			const user = c.get("user") as { id: string };

			// Get active bonus program
			const program = await getActiveBonusProgram(organizationId);

			if (!program) {
				return c.json(
					createErrorResponse("NO_ACTIVE_PROGRAM", "No active bonus program", [
						{
							code: "NO_ACTIVE_PROGRAM",
							path: ["rewards"],
							message: "",
						},
					]),
				);
			}

			// Get points balance
			const balance = await getPointsBalance(user.id, program.id);

			// Get tier info
			const tierInfo = await calculateUserTier(user.id, program.id);

			return c.json(
				createSuccessResponse({
					hasProgram: true,
					program: {
						id: program.id,
						name: program.name,
						description: program.description,
					},
					balance,
					tier: tierInfo,
				}),
			);
		} catch (error) {
			return handleRouteError(c, error, "fetch rewards balance");
		}
	})

	/**
	 * GET /api/storefront/rewards/history
	 * Get user's transaction history
	 */
	.get(
		"/history",
		authMiddleware,
		queryValidator(paginationSchema),
		async (c) => {
			try {
				const organizationId = validateOrgId(c.var.tenantId || undefined);
				const user = c.get("user") as { id: string };
				const { limit, offset } = c.req.valid("query");

				// Get active bonus program
				const program = await getActiveBonusProgram(organizationId);

				if (!program) {
					return c.json(
						createSuccessResponse({
							transactions: [],
							total: 0,
						}),
					);
				}

				// Get transaction history
				const history = await getTransactionHistory(
					user.id,
					program.id,
					limit,
					offset,
				);

				return c.json(createSuccessResponse(history));
			} catch (error) {
				return handleRouteError(c, error, "fetch transaction history");
			}
		},
	)

	/**
	 * GET /api/storefront/rewards/available
	 * Get available rewards user can redeem
	 */
	.get("/available", authMiddleware, async (c) => {
		try {
			const organizationId = validateOrgId(c.var.tenantId || undefined);
			const user = c.get("user") as { id: string };

			// Get active bonus program
			const program = await getActiveBonusProgram(organizationId);

			if (!program) {
				return c.json(
					createErrorResponse("NO_ACTIVE_PROGRAM", "No active bonus program", [
						{
							code: "NO_ACTIVE_PROGRAM",
							path: ["rewards"],
							message: "",
						},
					]),
				);
			}

			// Get available rewards
			const rewards = await getAvailableRewards(user?.id, program.id);

			return c.json(createSuccessResponse({ rewards }));
		} catch (error) {
			return handleRouteError(c, error, "fetch available rewards");
		}
	})

	/**
	 * POST /api/storefront/rewards/redeem
	 * Redeem a reward
	 */
	.post(
		"/redeem",
		authMiddleware,
		jsonValidator(redeemRewardSchema),
		async (c) => {
			try {
				const organizationId = validateOrgId(c.var.tenantId || undefined);
				const user = c.get("user") as { id: string };
				const { rewardId, payoutDetails } = c.req.valid("json");

				// Get active bonus program
				const program = await getActiveBonusProgram(organizationId);

				if (!program) {
					return c.json(
						createErrorResponse(
							"NO_ACTIVE_PROGRAM",
							"No active bonus program",
							[
								{
									code: "NO_ACTIVE_PROGRAM",
									path: ["rewards"],
									message: "",
								},
							],
						),
					);
				}

				// Redeem reward
				const result = await redeemReward(
					user.id,
					organizationId,
					program.id,
					rewardId,
					payoutDetails as {
						type: "paypal" | "bank_transfer";
						details: Record<string, string>;
					},
				);

				return c.json(
					createSuccessResponse(result, "Reward redeemed successfully"),
					201,
				);
			} catch (error) {
				return handleRouteError(c, error, "redeem reward");
			}
		},
	)

	/**
	 * GET /api/storefront/rewards/coupons
	 * Get user's coupons
	 */
	.get("/coupons", authMiddleware, async (c) => {
		try {
			const organizationId = validateOrgId(c.var.tenantId || undefined);
			const user = c.get("user") as { id: string };

			// Get user's coupons
			const coupons = await getUserCoupons(user.id, organizationId, false);

			return c.json(createSuccessResponse({ coupons }));
		} catch (error) {
			return handleRouteError(c, error, "fetch coupons");
		}
	})

	/**
	 * GET /api/storefront/rewards/referral-code
	 * Get user's referral code
	 */
	.get("/referral", authMiddleware, async (c) => {
		try {
			const organizationId = validateOrgId(c.var.tenantId || undefined);
			const user = c.get("user") as { id: string };

			// Get active bonus program
			const program = await getActiveBonusProgram(organizationId);

			if (!program) {
				return c.json(
					createErrorResponse("NO_ACTIVE_PROGRAM", "No active bonus program", [
						{
							code: "NO_ACTIVE_PROGRAM",
							path: ["rewards"],
							message: "",
						},
					]),
				);
			}
			// Get or create referral code
			const referral = await getOrCreateReferralCode(
				user.id,
				organizationId,
				program.id,
			);

			// Get referral stats
			const stats = await getReferralStats(user.id, program.id, organizationId);

			return c.json(
				createSuccessResponse({
					referralCode: referral.referralCode,
					stats,
					bonuses: {
						referrer: program.referralBonusReferrer,
						referee: program.referralBonusReferee,
					},
				}),
			);
		} catch (error) {
			return handleRouteError(c, error, "fetch referral code");
		}
	})

	/**
	 * GET /api/storefront/rewards/milestones
	 * Get user's milestone progress
	 */
	.get("/milestones", authMiddleware, async (c) => {
		try {
			const organizationId = validateOrgId(c.var.tenantId || undefined);
			const user = c.get("user") as { id: string };

			// Get active bonus program
			const program = await getActiveBonusProgram(organizationId);

			if (!program) {
				return c.json(
					createErrorResponse("NO_ACTIVE_PROGRAM", "No active bonus program", [
						{
							code: "NO_ACTIVE_PROGRAM",
							path: ["rewards"],
							message: "",
						},
					]),
				);
			}

			// Get user's milestones
			const milestones = await getUserMilestones(user.id, program.id);

			return c.json(createSuccessResponse({ milestones }));
		} catch (error) {
			return handleRouteError(c, error, "fetch milestones");
		}
	})

	/**
	 * GET /api/storefront/rewards/tier
	 * Get user's current tier information
	 */
	.get("/tier", authMiddleware, async (c) => {
		try {
			const organizationId = validateOrgId(c.var.tenantId || undefined);
			const user = c.get("user") as { id: string };

			// Get active bonus program
			const program = await getActiveBonusProgram(organizationId);

			if (!program) {
				return c.json(
					createErrorResponse("NO_ACTIVE_PROGRAM", "No active bonus program", [
						{
							code: "NO_ACTIVE_PROGRAM",
							path: ["rewards"],
							message: "",
						},
					]),
				);
			}

			// Get tier info
			const tierInfo = await calculateUserTier(user.id, program.id);

			return c.json(createSuccessResponse(tierInfo));
		} catch (error) {
			return handleRouteError(c, error, "fetch tier information");
		}
	})

	/**
	 * POST /api/storefront/rewards/coupons/validate
	 * Validate a coupon code
	 */
	.post(
		"/coupons/validate",
		authMiddleware,
		jsonValidator(applyCouponSchema),
		async (c) => {
			try {
				const organizationId = validateOrgId(c.var.tenantId || undefined);
				const { code, orderTotal } = c.req.valid("json");

				try {
					// Use applyCoupon to check everything (validity, expiration, min order amount)
					// It throws an error if invalid
					const result = await applyCoupon(code, organizationId, orderTotal);

					return c.json(
						createSuccessResponse(
							{
								valid: true,
								coupon: result.coupon,
								discountAmount: result.discountAmount,
							},
							"Coupon is valid",
						),
					);
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error ? error.message : "Unknown error";
					return c.json(
						createErrorResponse("ValidationError", errorMessage, [
							{
								code: "INVALID_COUPON",
								path: ["code"],
								message: errorMessage,
							},
						]),
						400,
					);
				}
			} catch (error) {
				return handleRouteError(c, error, "validate coupon");
			}
		},
	)

	/**
	 * POST /api/storefront/rewards/coupons/apply
	 * Apply a coupon to an order
	 */
	.post(
		"/coupons/apply",
		authMiddleware,
		jsonValidator(applyCouponSchema),
		async (c) => {
			try {
				const organizationId = validateOrgId(c.var.tenantId || undefined);
				const { code, orderTotal } = c.req.valid("json");

				const result = await applyCoupon(code, organizationId, orderTotal);

				return c.json(
					createSuccessResponse(result, "Coupon applied successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "apply coupon");
			}
		},
	);

export { storefrontRewardsRoute as rewardsRoutes };
