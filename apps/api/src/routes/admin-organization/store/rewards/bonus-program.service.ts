import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { TransactionDb } from "@/types/db";

/**
 * ---------------------------------------------------------------------------
 * BONUS PROGRAM SERVICE
 * Manages bonus program configuration and settings
 * ---------------------------------------------------------------------------
 */

type CreateBonusProgramInput = {
	organizationId: string;
	name: string;
	description?: string;
	pointsPerDollar?: string;
	minOrderAmount?: string;
	maxPointsPerOrder?: number;
	pointsExpireDays?: number;
	signupBonus?: number;
	referralBonusReferrer?: number;
	referralBonusReferee?: number;
	isActive?: boolean;
	metadata?: Record<string, unknown>;
};

type UpdateBonusProgramInput = Partial<CreateBonusProgramInput>;

/**
 * Create a new bonus program
 */
export async function createBonusProgram(input: CreateBonusProgramInput) {
	const [program] = await db
		.insert(schema.bonusProgram)
		.values({
			organizationId: input.organizationId,
			name: input.name,
			description: input.description,
			pointsPerDollar: input.pointsPerDollar || "1.00",
			minOrderAmount: input.minOrderAmount || "0.00",
			maxPointsPerOrder: input.maxPointsPerOrder,
			pointsExpireDays: input.pointsExpireDays,
			signupBonus: input.signupBonus || 0,
			referralBonusReferrer: input.referralBonusReferrer || 0,
			referralBonusReferee: input.referralBonusReferee || 0,
			isActive: input.isActive ?? true,
			metadata: input.metadata,
		})
		.returning();

	return program;
}

/**
 * Get bonus program by ID
 */
export async function getBonusProgram(
	programId: string,
	organizationId: string,
) {
	const program = await db.query.bonusProgram.findFirst({
		where: and(
			eq(schema.bonusProgram.id, programId),
			eq(schema.bonusProgram.organizationId, organizationId),
			isNull(schema.bonusProgram.deletedAt),
		),
		with: {
			tiers: {
				where: eq(schema.bonusTier.isActive, true),
				orderBy: [schema.bonusTier.minPoints],
			},
			rewards: {
				where: eq(schema.reward.isActive, true),
				orderBy: [schema.reward.sortOrder],
			},
			milestones: {
				where: eq(schema.bonusMilestone.isActive, true),
				orderBy: [schema.bonusMilestone.sortOrder],
			},
		},
	});

	return program;
}

/**
 * Get active bonus program for organization
 */
export async function getActiveBonusProgram(organizationId: string) {
	const program = await db.query.bonusProgram.findFirst({
		where: and(
			eq(schema.bonusProgram.organizationId, organizationId),
			eq(schema.bonusProgram.isActive, true),
			isNull(schema.bonusProgram.deletedAt),
		),
		with: {
			tiers: {
				where: eq(schema.bonusTier.isActive, true),
				orderBy: [schema.bonusTier.minPoints],
			},
		},
	});

	return program;
}

/**
 * List all bonus programs for organization
 */
export async function listBonusPrograms(organizationId: string) {
	const programs = await db.query.bonusProgram.findMany({
		where: and(
			eq(schema.bonusProgram.organizationId, organizationId),
			isNull(schema.bonusProgram.deletedAt),
		),
		orderBy: [desc(schema.bonusProgram.createdAt)],
	});

	return programs;
}

/**
 * Update bonus program
 */
export async function updateBonusProgram(
	programId: string,
	organizationId: string,
	input: UpdateBonusProgramInput,
) {
	const [updated] = await db
		.update(schema.bonusProgram)
		.set(input)
		.where(
			and(
				eq(schema.bonusProgram.id, programId),
				eq(schema.bonusProgram.organizationId, organizationId),
			),
		)
		.returning();

	return updated;
}

/**
 * Delete bonus program (soft delete)
 */
export async function deleteBonusProgram(
	programId: string,
	organizationId: string,
) {
	const [deleted] = await db
		.update(schema.bonusProgram)
		.set({ deletedAt: new Date() })
		.where(
			and(
				eq(schema.bonusProgram.id, programId),
				eq(schema.bonusProgram.organizationId, organizationId),
			),
		)
		.returning();

	return deleted;
}

/**
 * Get bonus program statistics
 */
export async function getBonusProgramStats(
	programId: string,
	organizationId: string,
) {
	// Get total users enrolled
	const [userCount] = await db
		.select({ count: sql<number>`count(*)` })
		.from(schema.userBonusAccount)
		.where(
			and(
				eq(schema.userBonusAccount.bonusProgramId, programId),
				eq(schema.userBonusAccount.organizationId, organizationId),
			),
		);

	// Get total points issued
	const [pointsIssued] = await db
		.select({
			total: sql<number>`sum(${schema.userBonusAccount.totalEarnedPoints})`,
		})
		.from(schema.userBonusAccount)
		.where(
			and(
				eq(schema.userBonusAccount.bonusProgramId, programId),
				eq(schema.userBonusAccount.organizationId, organizationId),
			),
		);

	// Get total points redeemed
	const [pointsRedeemed] = await db
		.select({
			total: sql<number>`sum(${schema.userBonusAccount.totalRedeemedPoints})`,
		})
		.from(schema.userBonusAccount)
		.where(
			and(
				eq(schema.userBonusAccount.bonusProgramId, programId),
				eq(schema.userBonusAccount.organizationId, organizationId),
			),
		);

	// Get active users (users with points activity in last 30 days)
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	const [activeUsers] = await db
		.select({
			count: sql<number>`count(distinct ${schema.userBonusAccount.userId})`,
		})
		.from(schema.userBonusAccount)
		.where(
			and(
				eq(schema.userBonusAccount.bonusProgramId, programId),
				eq(schema.userBonusAccount.organizationId, organizationId),
				sql`${schema.userBonusAccount.lastEarnedAt} >= ${thirtyDaysAgo.toISOString()}`,
			),
		);

	return {
		totalUsers: Number(userCount?.count || 0),
		totalPointsIssued: Number(pointsIssued?.total || 0),
		totalPointsRedeemed: Number(pointsRedeemed?.total || 0),
		activeUsers: Number(activeUsers?.count || 0),
		pointsOutstanding:
			Number(pointsIssued?.total || 0) - Number(pointsRedeemed?.total || 0),
	};
}

/**
 * Get or create user bonus account for a program
 */
export async function getOrCreateUserBonusAccount(
	userId: string,
	organizationId: string,
	bonusProgramId: string,
	tx?: TransactionDb,
) {
	const dbInstance = tx || db;

	// Try to find existing account
	let account = await dbInstance.query.userBonusAccount.findFirst({
		where: and(
			eq(schema.userBonusAccount.userId, userId),
			eq(schema.userBonusAccount.bonusProgramId, bonusProgramId),
		),
	});

	// Create if doesn't exist
	if (!account) {
		const [newAccount] = await dbInstance
			.insert(schema.userBonusAccount)
			.values({
				userId,
				organizationId,
				bonusProgramId,
				currentPoints: 0,
				pendingPoints: 0,
				totalEarnedPoints: 0,
				totalRedeemedPoints: 0,
				totalExpiredPoints: 0,
			})
			.returning();

		account = newAccount;
	}

	return account;
}
