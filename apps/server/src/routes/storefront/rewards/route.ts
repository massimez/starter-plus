import { z } from "zod";
import { createRouter } from "@/lib/create-hono-app";
import {
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
import { getUserCoupons } from "@/routes/admin-organization/store/rewards/coupon.service";
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
import { redeemRewardSchema } from "@/routes/admin-organization/store/rewards/schema";
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
	.get("/rewards/balance", authMiddleware, async (c) => {
		try {
			const organizationId = validateOrgId(
				c.get("session")?.activeOrganizationId as string,
			);
			const user = c.get("user");

			if (!user?.id) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			// Get active bonus program
			const program = await getActiveBonusProgram(organizationId);

			if (!program) {
				return c.json(
					createSuccessResponse({
						hasProgram: false,
						balance: null,
						tier: null,
					}),
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
		"/rewards/history",
		authMiddleware,
		queryValidator(paginationSchema),
		async (c) => {
			try {
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const user = c.get("user");
				const { limit, offset } = c.req.valid("query");

				if (!user?.id) {
					return c.json({ error: "Unauthorized" }, 401);
				}

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
	.get("/rewards/available", authMiddleware, async (c) => {
		try {
			const organizationId = validateOrgId(
				c.get("session")?.activeOrganizationId as string,
			);
			const user = c.get("user");

			if (!user?.id) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			// Get active bonus program
			const program = await getActiveBonusProgram(organizationId);

			if (!program) {
				return c.json(createSuccessResponse({ rewards: [] }));
			}

			// Get available rewards
			const rewards = await getAvailableRewards(user.id, program.id);

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
		"/rewards/redeem",
		authMiddleware,
		jsonValidator(redeemRewardSchema),
		async (c) => {
			try {
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const user = c.get("user");
				const { rewardId } = c.req.valid("json");

				if (!user?.id) {
					return c.json({ error: "Unauthorized" }, 401);
				}

				// Get active bonus program
				const program = await getActiveBonusProgram(organizationId);

				if (!program) {
					return c.json({ error: "No active bonus program" }, 400);
				}

				// Redeem reward
				const result = await redeemReward(
					user.id,
					organizationId,
					program.id,
					rewardId,
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
	.get("/rewards/coupons", authMiddleware, async (c) => {
		try {
			const organizationId = validateOrgId(
				c.get("session")?.activeOrganizationId as string,
			);
			const user = c.get("user");

			if (!user?.id) {
				return c.json({ error: "Unauthorized" }, 401);
			}

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
	.get("/rewards/referral-code", authMiddleware, async (c) => {
		try {
			const organizationId = validateOrgId(
				c.get("session")?.activeOrganizationId as string,
			);
			const user = c.get("user");

			if (!user?.id) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			// Get active bonus program
			const program = await getActiveBonusProgram(organizationId);

			if (!program) {
				return c.json({ error: "No active bonus program" }, 400);
			}

			// Get or create referral code
			const referral = await getOrCreateReferralCode(
				user.id,
				organizationId,
				program.id,
			);

			// Get referral stats
			const stats = await getReferralStats(user.id, program.id);

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
	.get("/rewards/milestones", authMiddleware, async (c) => {
		try {
			const organizationId = validateOrgId(
				c.get("session")?.activeOrganizationId as string,
			);
			const user = c.get("user");

			if (!user?.id) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			// Get active bonus program
			const program = await getActiveBonusProgram(organizationId);

			if (!program) {
				return c.json(createSuccessResponse({ milestones: [] }));
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
	.get("/rewards/tier", authMiddleware, async (c) => {
		try {
			const organizationId = validateOrgId(
				c.get("session")?.activeOrganizationId as string,
			);
			const user = c.get("user");

			if (!user?.id) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			// Get active bonus program
			const program = await getActiveBonusProgram(organizationId);

			if (!program) {
				return c.json(createSuccessResponse({ tier: null }));
			}

			// Get tier info
			const tierInfo = await calculateUserTier(user.id, program.id);

			return c.json(createSuccessResponse(tierInfo));
		} catch (error) {
			return handleRouteError(c, error, "fetch tier information");
		}
	});

export { storefrontRewardsRoute as rewardsRoutes };
