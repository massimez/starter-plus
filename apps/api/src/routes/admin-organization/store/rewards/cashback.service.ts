import type { TransactionDb } from "@/types/db";
import { getActiveBonusProgram } from "./bonus-program.service";
import { awardPoints } from "./points.service";
import { calculateUserTier } from "./tier.service";

/**
 * ---------------------------------------------------------------------------
 * CASHBACK SERVICE
 * Manages cashback calculations and awards
 * ---------------------------------------------------------------------------
 */

/**
 * Calculate cashback amount based on order total and program settings
 */
export async function calculateCashback(
	organizationId: string,
	orderTotal: number,
) {
	// Get active bonus program
	const program = await getActiveBonusProgram(organizationId);

	if (!program) {
		return 0;
	}

	// Check minimum order amount
	const minOrderAmount = Number(program.minOrderAmount || 0);
	if (orderTotal < minOrderAmount) {
		return 0;
	}

	// Calculate base points
	const pointsPerDollar = Number(program.pointsPerDollar || 1);
	let points = Math.floor(orderTotal * pointsPerDollar);

	// Apply max points limit if set
	if (program.maxPointsPerOrder && points > program.maxPointsPerOrder) {
		points = program.maxPointsPerOrder;
	}

	return points;
}

/**
 * Calculate cashback with tier multiplier
 */
export async function calculateCashbackWithTier(
	userId: string,
	organizationId: string,
	orderTotal: number,
) {
	// Get active bonus program
	const program = await getActiveBonusProgram(organizationId);

	if (!program) {
		return { points: 0, multiplier: 1, tier: null };
	}

	// Calculate base cashback
	const basePoints = await calculateCashback(organizationId, orderTotal);

	// Get user's tier
	const tierInfo = await calculateUserTier(userId, program.id);

	let multiplier = 1;
	if (tierInfo?.currentTier?.multiplier) {
		multiplier = Number(tierInfo.currentTier.multiplier);
	}

	const finalPoints = Math.floor(basePoints * multiplier);

	return {
		points: finalPoints,
		basePoints,
		multiplier,
		tier: tierInfo?.currentTier || null,
	};
}

/**
 * Award cashback points for an order
 */
export async function awardCashback(
	userId: string,
	organizationId: string,
	orderId: string,
	orderTotal: number,
	status: "pending" | "confirmed" = "pending",
	tx?: TransactionDb,
) {
	// Get active bonus program
	const program = await getActiveBonusProgram(organizationId);

	if (!program) {
		return null;
	}

	// Calculate cashback with tier multiplier
	const cashback = await calculateCashbackWithTier(
		userId,
		organizationId,
		orderTotal,
	);

	if (cashback.points <= 0) {
		return null;
	}

	// Calculate expiration if set
	let expiresAt: Date | undefined;
	if (program.pointsExpireDays) {
		expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + program.pointsExpireDays);
	}

	// Award points
	const transaction = await awardPoints(
		{
			userId,
			organizationId,
			bonusProgramId: program.id,
			points: cashback.points,
			type: "earned_purchase",
			description: `Cashback for order (${cashback.multiplier}x multiplier)`,
			orderId,
			status,
			expiresAt,
			metadata: {
				orderTotal,
				basePoints: cashback.basePoints,
				multiplier: cashback.multiplier,
				tierId: cashback.tier?.id,
				tierName: cashback.tier?.name,
			},
		},
		tx,
	);

	return {
		transaction,
		cashback,
	};
}

/**
 * Get cashback history for user
 */
export async function getCashbackHistory(
	userId: string,
	bonusProgramId: string,
	limit = 20,
	offset = 0,
) {
	const { getTransactionHistory } = await import("./points.service");

	const history = await getTransactionHistory(
		userId,
		bonusProgramId,
		limit,
		offset,
	);

	// Filter for cashback transactions
	const cashbackTransactions = history.transactions.filter(
		(t) => t.type === "earned_purchase",
	);

	return {
		transactions: cashbackTransactions,
		total: cashbackTransactions.length,
	};
}
