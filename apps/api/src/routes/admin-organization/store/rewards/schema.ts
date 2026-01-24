import { z } from "zod";

/**
 * ---------------------------------------------------------------------------
 * BONUS PROGRAM SCHEMAS
 * ---------------------------------------------------------------------------
 */
export const createBonusProgramSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string().optional(),
	pointsPerDollar: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/, "Must be a valid decimal number")
		.optional(),
	minOrderAmount: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/, "Must be a valid decimal number")
		.optional(),
	maxPointsPerOrder: z.number().int().positive().optional(),
	pointsExpireDays: z.number().int().positive().optional(),
	signupBonus: z.number().int().min(0).optional(),
	referralBonusReferrer: z.number().int().min(0).optional(),
	referralBonusReferee: z.number().int().min(0).optional(),
	isActive: z.boolean().optional(),
	metadata: z.record(z.string(), z.any()).optional(),
});

export const updateBonusProgramSchema = createBonusProgramSchema.partial();

/**
 * ---------------------------------------------------------------------------
 * TIER SCHEMAS
 * ---------------------------------------------------------------------------
 */
export const createTierSchema = z.object({
	bonusProgramId: z.uuid(),
	name: z.string().min(1).max(100),
	slug: z.string().min(1).max(100),
	minPoints: z.number().int().min(0),
	multiplier: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/, "Must be a valid decimal number")
		.optional(),
	description: z.string().optional(),
	benefits: z.array(z.record(z.string(), z.any())).optional(),
	sortOrder: z.number().int().optional(),
});

export const updateTierSchema = createTierSchema
	.omit({
		bonusProgramId: true,
	})
	.partial();

/**
 * ---------------------------------------------------------------------------
 * REWARD SCHEMAS
 * ---------------------------------------------------------------------------
 */
export const createRewardSchema = z.object({
	bonusProgramId: z.string().uuid(),
	name: z.string().min(1).max(255),
	description: z.string().optional(),
	type: z.enum([
		"percentage_discount",
		"fixed_discount",
		"free_shipping",
		"free_product",
		"cash_back",
	]),
	pointsCost: z.number().int().positive(),
	cashAmount: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/)
		.optional(),
	discountPercentage: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/)
		.optional(),
	discountAmount: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/)
		.optional(),
	minOrderAmount: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/)
		.optional(),
	maxRedemptionsPerUser: z.number().int().positive().optional(),
	totalRedemptionsLimit: z.number().int().positive().optional(),
	validFrom: z.iso.datetime().optional(),
	validUntil: z.iso.datetime().optional(),
	image: z.url().optional(),
	sortOrder: z.number().int().optional(),
	metadata: z.record(z.string(), z.any()).optional(),
});

export const updateRewardSchema = createRewardSchema
	.omit({
		bonusProgramId: true,
	})
	.partial();

export const redeemRewardSchema = z.object({
	rewardId: z.uuid(),
	payoutDetails: z
		.object({
			type: z.enum(["paypal", "bank_transfer"]),
			details: z.record(z.string(), z.string()),
		})
		.optional(),
});

/**
 * ---------------------------------------------------------------------------
 * MILESTONE SCHEMAS
 * ---------------------------------------------------------------------------
 */
export const createMilestoneSchema = z.object({
	bonusProgramId: z.string().uuid(),
	name: z.string().min(1).max(255),
	description: z.string().optional(),
	type: z.enum([
		"first_purchase",
		"total_spent",
		"order_count",
		"product_review",
		"referral_count",
		"custom",
	]),
	targetValue: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/, "Must be a valid decimal number"),
	rewardPoints: z.number().int().positive(),
	isRepeatable: z.boolean().optional(),
	sortOrder: z.number().int().optional(),
	metadata: z.record(z.string(), z.any()).optional(),
});

export const updateMilestoneSchema = createMilestoneSchema
	.omit({
		bonusProgramId: true,
	})
	.partial();

/**
 * ---------------------------------------------------------------------------
 * REFERRAL SCHEMAS
 * ---------------------------------------------------------------------------
 */
export const validateReferralCodeSchema = z.object({
	code: z.string().min(1).max(50),
});

/**
 * ---------------------------------------------------------------------------
 * COUPON SCHEMAS
 * ---------------------------------------------------------------------------
 */
export const applyCouponSchema = z.object({
	code: z.string().min(1).max(50),
	orderTotal: z.number().positive(),
});

export const cancelCouponSchema = z.object({
	couponId: z.uuid(),
});

/**
 * ---------------------------------------------------------------------------
 * POINTS SCHEMAS
 * ---------------------------------------------------------------------------
 */
export const awardPointsManualSchema = z.object({
	userId: z.string(),
	points: z.number().int(),
	description: z.string().optional(),
	expiresAt: z.iso.datetime().optional(),
});
