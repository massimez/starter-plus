import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { getAuditData } from "@/lib/utils/audit";

/**
 * ---------------------------------------------------------------------------
 * TIER SERVICE
 * Manages tier system and user tier progression
 * ---------------------------------------------------------------------------
 */

type CreateTierInput = {
	organizationId: string;
	bonusProgramId: string;
	name: string;
	slug: string;
	minPoints: number;
	multiplier?: string;
	description?: string;
	benefits?: Record<string, unknown>[];
	sortOrder?: number;
};

/**
 * Create a new tier
 */
export async function createTier(input: CreateTierInput, user: { id: string }) {
	const [tier] = await db
		.insert(schema.bonusTier)
		.values({
			organizationId: input.organizationId,
			bonusProgramId: input.bonusProgramId,
			name: input.name,
			slug: input.slug,
			minPoints: input.minPoints,
			multiplier: input.multiplier || "1.00",
			description: input.description,
			benefits: input.benefits,
			sortOrder: input.sortOrder || 0,
			...getAuditData(user, "create"),
		})
		.returning();

	return tier;
}

/**
 * Update tier
 */
export async function updateTier(
	tierId: string,
	organizationId: string,
	input: Partial<CreateTierInput>,
	user: { id: string },
) {
	const [updated] = await db
		.update(schema.bonusTier)
		.set({
			...input,
			...getAuditData(user, "update"),
		})
		.where(
			and(
				eq(schema.bonusTier.id, tierId),
				eq(schema.bonusTier.organizationId, organizationId),
			),
		)
		.returning();

	return updated;
}

/**
 * Delete tier
 */
export async function deleteTier(
	tierId: string,
	organizationId: string,
	user: { id: string },
) {
	const [deleted] = await db
		.update(schema.bonusTier)
		.set({
			deletedAt: new Date(),
			isActive: false,
			...getAuditData(user, "delete"),
		})
		.where(
			and(
				eq(schema.bonusTier.id, tierId),
				eq(schema.bonusTier.organizationId, organizationId),
			),
		)
		.returning();

	return deleted;
}

/**
 * List tiers for a program
 */
export async function listTiers(bonusProgramId: string) {
	const tiers = await db.query.bonusTier.findMany({
		where: and(
			eq(schema.bonusTier.bonusProgramId, bonusProgramId),
			eq(schema.bonusTier.isActive, true),
		),
		orderBy: [asc(schema.bonusTier.minPoints)],
	});

	return tiers;
}

/**
 * Calculate user's current tier based on points
 */
export async function calculateUserTier(
	userId: string,
	bonusProgramId: string,
) {
	// Get user's current points
	const account = await db.query.userBonusAccount.findFirst({
		where: and(
			eq(schema.userBonusAccount.userId, userId),
			eq(schema.userBonusAccount.bonusProgramId, bonusProgramId),
		),
	});

	if (!account) {
		return null;
	}

	const currentPoints = Number(account.currentPoints);

	// Get all tiers for this program
	const tiers = await db.query.bonusTier.findMany({
		where: and(
			eq(schema.bonusTier.bonusProgramId, bonusProgramId),
			eq(schema.bonusTier.isActive, true),
		),
		orderBy: [asc(schema.bonusTier.minPoints)],
	});

	// Find the highest tier the user qualifies for
	let currentTier = null;
	let nextTier = null;

	for (let i = 0; i < tiers.length; i++) {
		if (currentPoints >= tiers[i].minPoints) {
			currentTier = tiers[i];
			nextTier = tiers[i + 1] || null;
		} else {
			if (!currentTier) {
				nextTier = tiers[i];
			}
			break;
		}
	}

	// Calculate progress to next tier
	let tierProgress = 0;
	if (currentTier && nextTier) {
		const pointsInCurrentTier = currentPoints - currentTier.minPoints;
		const pointsNeededForNext = nextTier.minPoints - currentTier.minPoints;
		tierProgress = (pointsInCurrentTier / pointsNeededForNext) * 100;
	}

	// Update user's tier if changed
	if (currentTier && currentTier.id !== account.currentTierId) {
		await db
			.update(schema.userBonusAccount)
			.set({
				currentTierId: currentTier.id,
				tierProgress: tierProgress.toFixed(2),
			})
			.where(eq(schema.userBonusAccount.id, account.id));
	}

	return {
		currentTier,
		nextTier,
		tierProgress: Number.parseFloat(tierProgress.toFixed(2)),
		currentPoints,
		pointsToNextTier: nextTier ? nextTier.minPoints - currentPoints : 0,
	};
}

/**
 * Get tier benefits
 */
export async function getTierBenefits(tierId: string) {
	const tier = await db.query.bonusTier.findFirst({
		where: eq(schema.bonusTier.id, tierId),
	});

	return tier?.benefits || [];
}
