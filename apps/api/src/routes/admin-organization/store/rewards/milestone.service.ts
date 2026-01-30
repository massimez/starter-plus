import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { TMilestoneType } from "@/lib/db/schema/helpers/types";
import { getAuditData } from "@/lib/utils/audit";
import type { TransactionDb } from "@/types/db";
import { awardPoints } from "./points.service";

/**
 * ---------------------------------------------------------------------------
 * MILESTONE SERVICE
 * Manages achievement-based rewards and user progress tracking
 * ---------------------------------------------------------------------------
 */

type CreateMilestoneInput = {
	organizationId: string;
	bonusProgramId: string;
	name: string;
	description?: string;
	type: TMilestoneType;
	targetValue: string;
	rewardPoints: number;
	isRepeatable?: boolean;
	sortOrder?: number;
	metadata?: Record<string, unknown>;
};

/**
 * Create a new milestone
 */
export async function createMilestone(
	input: CreateMilestoneInput,
	user: { id: string },
) {
	const [milestone] = await db
		.insert(schema.bonusMilestone)
		.values({
			organizationId: input.organizationId,
			bonusProgramId: input.bonusProgramId,
			name: input.name,
			description: input.description,
			type: input.type,
			targetValue: input.targetValue,
			rewardPoints: input.rewardPoints,
			isRepeatable: input.isRepeatable || false,
			sortOrder: input.sortOrder || 0,
			metadata: input.metadata,
			...getAuditData(user, "create"),
		})
		.returning();

	return milestone;
}

/**
 * Update milestone
 */
export async function updateMilestone(
	milestoneId: string,
	organizationId: string,
	input: Partial<CreateMilestoneInput>,
	user: { id: string },
) {
	const [updated] = await db
		.update(schema.bonusMilestone)
		.set({
			...input,
			...getAuditData(user, "update"),
		})
		.where(
			and(
				eq(schema.bonusMilestone.id, milestoneId),
				eq(schema.bonusMilestone.organizationId, organizationId),
			),
		)
		.returning();

	return updated;
}

/**
 * Delete milestone
 */
export async function deleteMilestone(
	milestoneId: string,
	organizationId: string,
	user: { id: string },
) {
	const [deleted] = await db
		.update(schema.bonusMilestone)
		.set({
			deletedAt: new Date(),
			isActive: false,
			...getAuditData(user, "delete"),
		})
		.where(
			and(
				eq(schema.bonusMilestone.id, milestoneId),
				eq(schema.bonusMilestone.organizationId, organizationId),
			),
		)
		.returning();

	return deleted;
}

/**
 * List milestones for a program
 */
export async function listMilestones(bonusProgramId: string) {
	const milestones = await db.query.bonusMilestone.findMany({
		where: and(
			eq(schema.bonusMilestone.bonusProgramId, bonusProgramId),
			eq(schema.bonusMilestone.isActive, true),
		),
		orderBy: [asc(schema.bonusMilestone.sortOrder)],
	});

	return milestones;
}

/**
 * Track milestone progress for user
 */
export async function trackMilestoneProgress(
	userId: string,
	organizationId: string,
	milestoneId: string,
	incrementValue: number,
	tx?: TransactionDb,
) {
	return await (tx || db).transaction(async (trx) => {
		// Get or create progress record
		let progress = await trx.query.userMilestoneProgress.findFirst({
			where: and(
				eq(schema.userMilestoneProgress.userId, userId),
				eq(schema.userMilestoneProgress.milestoneId, milestoneId),
			),
		});

		if (!progress) {
			const [newProgress] = await trx
				.insert(schema.userMilestoneProgress)
				.values({
					organizationId,
					userId,
					milestoneId,
					currentValue: incrementValue.toString(),
				})
				.returning();

			progress = newProgress;
		} else {
			// Update progress
			const newValue = Number(progress.currentValue) + incrementValue;

			await trx
				.update(schema.userMilestoneProgress)
				.set({
					currentValue: newValue.toString(),
				})
				.where(eq(schema.userMilestoneProgress.id, progress.id));

			progress.currentValue = newValue.toString();
		}

		return progress;
	});
}

/**
 * Check if milestone is completed and award bonus
 */
export async function checkMilestoneCompletion(
	userId: string,
	organizationId: string,
	bonusProgramId: string,
	milestoneId: string,
	tx?: TransactionDb,
) {
	return await (tx || db).transaction(async (trx) => {
		// Get milestone and progress
		const milestone = await trx.query.bonusMilestone.findFirst({
			where: eq(schema.bonusMilestone.id, milestoneId),
		});

		if (!milestone) {
			throw new Error("Milestone not found");
		}

		const progress = await trx.query.userMilestoneProgress.findFirst({
			where: and(
				eq(schema.userMilestoneProgress.userId, userId),
				eq(schema.userMilestoneProgress.milestoneId, milestoneId),
			),
		});

		if (!progress) {
			return null;
		}

		const currentValue = Number(progress.currentValue);
		const targetValue = Number(milestone.targetValue);

		// Check if completed
		if (currentValue >= targetValue) {
			// Check if already completed and not repeatable
			if (progress.isCompleted && !milestone.isRepeatable) {
				return null;
			}

			// Award bonus
			const transaction = await awardPoints(
				{
					userId,
					organizationId,
					bonusProgramId,
					points: milestone.rewardPoints,
					type: "earned_manual",
					description: `Milestone achieved: ${milestone.name}`,
					status: "confirmed",
					metadata: {
						milestoneId: milestone.id,
						milestoneName: milestone.name,
					},
				},
				trx,
			);

			// Update progress
			await trx
				.update(schema.userMilestoneProgress)
				.set({
					isCompleted: true,
					completedAt: new Date(),
					completionCount: Number(progress.completionCount) + 1,
					bonusTransactionId: transaction.id,
					// Reset for repeatable milestones
					currentValue: milestone.isRepeatable ? "0" : progress.currentValue,
				})
				.where(eq(schema.userMilestoneProgress.id, progress.id));

			return {
				milestone,
				progress,
				transaction,
			};
		}

		return null;
	});
}

/**
 * Get user's milestone progress
 */
export async function getUserMilestones(
	userId: string,
	bonusProgramId: string,
) {
	// Get all milestones for program
	const milestones = await db.query.bonusMilestone.findMany({
		where: and(
			eq(schema.bonusMilestone.bonusProgramId, bonusProgramId),
			eq(schema.bonusMilestone.isActive, true),
		),
		orderBy: [asc(schema.bonusMilestone.sortOrder)],
	});

	// Get user's progress for each milestone
	const progress = await db.query.userMilestoneProgress.findMany({
		where: eq(schema.userMilestoneProgress.userId, userId),
	});

	// Combine milestone data with progress
	const milestonesWithProgress = milestones.map((milestone) => {
		const userProgress = progress.find((p) => p.milestoneId === milestone.id);

		const currentValue = Number(userProgress?.currentValue || 0);
		const targetValue = Number(milestone.targetValue);
		const progressPercentage = Math.min(
			(currentValue / targetValue) * 100,
			100,
		);

		return {
			...milestone,
			currentValue,
			targetValue,
			progressPercentage: Number.parseFloat(progressPercentage.toFixed(2)),
			isCompleted: userProgress?.isCompleted || false,
			completedAt: userProgress?.completedAt,
			completionCount: userProgress?.completionCount || 0,
		};
	});

	return milestonesWithProgress;
}

/**
 * Check milestones for specific event types
 */
export async function checkMilestonesForEvent(
	userId: string,
	organizationId: string,
	bonusProgramId: string,
	eventType: TMilestoneType,
	eventValue: number,
	tx?: TransactionDb,
) {
	return await (tx || db).transaction(async (trx) => {
		// Get all active milestones of this type
		const milestones = await trx.query.bonusMilestone.findMany({
			where: and(
				eq(schema.bonusMilestone.bonusProgramId, bonusProgramId),
				eq(schema.bonusMilestone.type, eventType),
				eq(schema.bonusMilestone.isActive, true),
			),
		});

		const results = [];

		for (const milestone of milestones) {
			// Track progress
			await trackMilestoneProgress(
				userId,
				organizationId,
				milestone.id,
				eventValue,
				trx,
			);

			// Check completion
			const result = await checkMilestoneCompletion(
				userId,
				organizationId,
				bonusProgramId,
				milestone.id,
				trx,
			);

			if (result) {
				results.push(result);
			}
		}

		return results;
	});
}
