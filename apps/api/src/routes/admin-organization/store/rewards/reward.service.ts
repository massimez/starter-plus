import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { TRewardType } from "@/lib/db/schema/helpers/types";
import { getAuditData } from "@/lib/utils/audit";
import type { TransactionDb } from "@/types/db";
import { generateUniqueCouponCode } from "./coupon.service";
import { deductPoints } from "./points.service";

/**
 * ---------------------------------------------------------------------------
 * REWARD SERVICE
 * Manages reward catalog and redemptions
 * ---------------------------------------------------------------------------
 */

type CreateRewardInput = {
	organizationId: string;
	bonusProgramId: string;
	name: string;
	description?: string;
	type: TRewardType;
	pointsCost: number;
	cashAmount?: string;
	discountPercentage?: string;
	discountAmount?: string;
	minOrderAmount?: string;
	maxRedemptionsPerUser?: number;
	totalRedemptionsLimit?: number;
	validFrom?: Date;
	validUntil?: Date;
	image?: string;
	sortOrder?: number;
	metadata?: Record<string, unknown>;
};

/**
 * Create a new reward
 */
export async function createReward(
	input: CreateRewardInput,
	user: { id: string },
) {
	const [reward] = await db
		.insert(schema.reward)
		.values({
			organizationId: input.organizationId,
			bonusProgramId: input.bonusProgramId,
			name: input.name,
			description: input.description,
			type: input.type,
			pointsCost: input.pointsCost,
			cashAmount: input.cashAmount,
			discountPercentage: input.discountPercentage,
			discountAmount: input.discountAmount,
			minOrderAmount: input.minOrderAmount,
			maxRedemptionsPerUser: input.maxRedemptionsPerUser,
			totalRedemptionsLimit: input.totalRedemptionsLimit,
			validFrom: input.validFrom,
			validUntil: input.validUntil,
			image: input.image,
			sortOrder: input.sortOrder || 0,
			metadata: input.metadata,
			...getAuditData(user, "create"),
		})
		.returning();

	return reward;
}

/**
 * Update reward
 */
export async function updateReward(
	rewardId: string,
	organizationId: string,
	input: Partial<CreateRewardInput>,
	user: { id: string },
) {
	const [updated] = await db
		.update(schema.reward)
		.set({
			...input,
			...getAuditData(user, "update"),
		})
		.where(
			and(
				eq(schema.reward.id, rewardId),
				eq(schema.reward.organizationId, organizationId),
			),
		)
		.returning();

	return updated;
}

/**
 * Delete reward
 */
export async function deleteReward(
	rewardId: string,
	organizationId: string,
	user: { id: string },
) {
	const [deleted] = await db
		.update(schema.reward)
		.set({
			deletedAt: new Date(),
			isActive: false,
			...getAuditData(user, "delete"),
		})
		.where(
			and(
				eq(schema.reward.id, rewardId),
				eq(schema.reward.organizationId, organizationId),
			),
		)
		.returning();

	return deleted;
}

/**
 * List rewards for a program
 */
export async function listRewards(bonusProgramId: string) {
	const rewards = await db.query.reward.findMany({
		where: and(
			eq(schema.reward.bonusProgramId, bonusProgramId),
			eq(schema.reward.isActive, true),
		),
		orderBy: [asc(schema.reward.sortOrder), desc(schema.reward.createdAt)],
	});

	return rewards;
}

/**
 * Get available rewards for user (considering points balance and redemption limits)
 */
export async function getAvailableRewards(
	userId: string,
	bonusProgramId: string,
) {
	// Get user's points balance
	const account = await db.query.userBonusAccount.findFirst({
		where: and(
			eq(schema.userBonusAccount.userId, userId),
			eq(schema.userBonusAccount.bonusProgramId, bonusProgramId),
		),
	});

	const userPoints = Number(account?.currentPoints || 0);

	// Get all active rewards
	const rewards = await db.query.reward.findMany({
		where: and(
			eq(schema.reward.bonusProgramId, bonusProgramId),
			eq(schema.reward.isActive, true),
		),
		orderBy: [asc(schema.reward.sortOrder)],
	});

	const now = new Date();

	// Filter and enrich rewards
	const availableRewards = await Promise.all(
		rewards.map(async (reward) => {
			// Check validity dates
			if (reward.validFrom && reward.validFrom > now) {
				return null;
			}
			if (reward.validUntil && reward.validUntil < now) {
				return null;
			}

			// Check total redemption limit
			if (
				reward.totalRedemptionsLimit &&
				Number(reward.currentRedemptions) >= reward.totalRedemptionsLimit
			) {
				return null;
			}

			// Check user redemption limit
			let userRedemptions = 0;
			if (reward.maxRedemptionsPerUser) {
				const [count] = await db
					.select({ count: sql<number>`count(*)` })
					.from(schema.bonusCoupon)
					.where(
						and(
							eq(schema.bonusCoupon.userId, userId),
							eq(schema.bonusCoupon.rewardId, reward.id),
						),
					);

				userRedemptions = Number(count?.count || 0);

				if (userRedemptions >= reward.maxRedemptionsPerUser) {
					return null;
				}
			}

			return {
				...reward,
				canAfford: userPoints >= reward.pointsCost,
				userRedemptions,
				remainingRedemptions: reward.maxRedemptionsPerUser
					? reward.maxRedemptionsPerUser - userRedemptions
					: null,
			};
		}),
	);

	return availableRewards.filter((r) => r !== null);
}

/**
 * Redeem reward for user
 */
export async function redeemReward(
	userId: string,
	organizationId: string,
	bonusProgramId: string,
	rewardId: string,
	payoutDetails?: {
		type: "paypal" | "bank_transfer";
		details: Record<string, string>;
	},
	tx?: TransactionDb,
) {
	return await (tx || db).transaction(async (trx) => {
		// Get reward
		const reward = await trx.query.reward.findFirst({
			where: eq(schema.reward.id, rewardId),
		});

		if (!reward) {
			throw new Error("Reward not found");
		}

		if (!reward.isActive) {
			throw new Error("Reward is not active");
		}

		// Check validity
		const now = new Date();
		if (reward.validFrom && reward.validFrom > now) {
			throw new Error("Reward is not yet available");
		}
		if (reward.validUntil && reward.validUntil < now) {
			throw new Error("Reward has expired");
		}

		// Check total redemption limit
		if (
			reward.totalRedemptionsLimit &&
			Number(reward.currentRedemptions) >= reward.totalRedemptionsLimit
		) {
			throw new Error("Reward redemption limit reached");
		}

		// Check user redemption limit
		if (reward.maxRedemptionsPerUser) {
			const [count] = await trx
				.select({ count: sql<number>`count(*)` })
				.from(schema.bonusCoupon)
				.where(
					and(
						eq(schema.bonusCoupon.userId, userId),
						eq(schema.bonusCoupon.rewardId, rewardId),
					),
				);

			if (Number(count?.count || 0) >= reward.maxRedemptionsPerUser) {
				throw new Error("User redemption limit reached for this reward");
			}
		}

		// Handle Cash Back Payout
		if (reward.type === "cash_back") {
			if (!payoutDetails) {
				throw new Error("Payout details are required for cash back rewards");
			}

			if (!reward.cashAmount) {
				throw new Error("Reward does not have a cash amount configured");
			}

			// Deduct points
			const transaction = await deductPoints(
				userId,
				organizationId,
				bonusProgramId,
				reward.pointsCost,
				"redeemed_cash",
				`Requested cash back: ${reward.name}`,
				{ rewardId: reward.id, rewardName: reward.name },
				trx,
			);

			// Create Payout Request
			const [payout] = await trx
				.insert(schema.payoutRequest)
				.values({
					organizationId,
					userId,
					pointsDeducted: reward.pointsCost,
					cashAmount: reward.cashAmount,
					status: "pending",
					payoutMethod: payoutDetails,
					bonusTransactionId: transaction.id,
				})
				.returning();

			// Update reward redemption count
			await trx
				.update(schema.reward)
				.set({
					currentRedemptions: Number(reward.currentRedemptions) + 1,
				})
				.where(eq(schema.reward.id, rewardId));

			return {
				reward,
				payout,
				transaction,
			};
		}

		// Deduct points (Standard Reward)
		const transaction = await deductPoints(
			userId,
			organizationId,
			bonusProgramId,
			reward.pointsCost,
			"redeemed_discount",
			`Redeemed reward: ${reward.name}`,
			{ rewardId: reward.id, rewardName: reward.name },
			trx,
		);

		// Generate coupon
		const couponCode = await generateUniqueCouponCode();

		// Calculate expiration (30 days from now by default)
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 30);

		const [coupon] = await trx
			.insert(schema.bonusCoupon)
			.values({
				organizationId,
				userId,
				rewardId: reward.id,
				bonusTransactionId: transaction.id,
				code: couponCode,
				type: reward.type,
				discountPercentage: reward.discountPercentage,
				discountAmount: reward.discountAmount,
				minOrderAmount: reward.minOrderAmount,
				expiresAt,
			})
			.returning();

		// Update reward redemption count
		await trx
			.update(schema.reward)
			.set({
				currentRedemptions: Number(reward.currentRedemptions) + 1,
			})
			.where(eq(schema.reward.id, rewardId));

		return {
			reward,
			coupon,
			transaction,
		};
	});
}

/**
 * Get reward by ID
 */
export async function getReward(rewardId: string, organizationId: string) {
	const reward = await db.query.reward.findFirst({
		where: and(
			eq(schema.reward.id, rewardId),
			eq(schema.reward.organizationId, organizationId),
		),
	});

	return reward;
}
