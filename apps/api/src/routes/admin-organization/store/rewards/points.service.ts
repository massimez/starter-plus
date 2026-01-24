import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { TBonusTransactionType } from "@/lib/db/schema/helpers/types";
import type { TransactionDb } from "@/types/db";
import { getOrCreateUserBonusAccount } from "./bonus-program.service";

/**
 * ---------------------------------------------------------------------------
 * POINTS SERVICE
 * Core points management: award, deduct, confirm, expire
 * ---------------------------------------------------------------------------
 */

type AwardPointsInput = {
	userId: string;
	organizationId: string;
	bonusProgramId: string;
	points: number;
	type: TBonusTransactionType;
	description?: string;
	orderId?: string;
	status?: "pending" | "confirmed";
	expiresAt?: Date;
	metadata?: Record<string, unknown>;
};

/**
 * Award points to user
 */
export async function awardPoints(input: AwardPointsInput, tx?: TransactionDb) {
	return await (tx || db).transaction(async (trx) => {
		// Get or create user bonus account
		const account = await getOrCreateUserBonusAccount(
			input.userId,
			input.organizationId,
			input.bonusProgramId,
			trx,
		);

		const status = input.status || "pending";
		const balanceBefore = Number(account.currentPoints);

		// Update account based on status
		let balanceAfter = balanceBefore;
		if (status === "confirmed") {
			balanceAfter = balanceBefore + input.points;
			await trx
				.update(schema.userBonusAccount)
				.set({
					currentPoints: balanceAfter,
					totalEarnedPoints: Number(account.totalEarnedPoints) + input.points,
					lastEarnedAt: new Date(),
				})
				.where(eq(schema.userBonusAccount.id, account.id));
		} else {
			// Pending points
			await trx
				.update(schema.userBonusAccount)
				.set({
					pendingPoints: Number(account.pendingPoints) + input.points,
				})
				.where(eq(schema.userBonusAccount.id, account.id));
		}

		// Create transaction record
		const [transaction] = await trx
			.insert(schema.bonusTransaction)
			.values({
				organizationId: input.organizationId,
				userBonusAccountId: account.id,
				type: input.type,
				points: input.points,
				balanceBefore,
				balanceAfter,
				orderId: input.orderId,
				description: input.description,
				status,
				expiresAt: input.expiresAt,
				metadata: input.metadata,
			})
			.returning();

		// If points expire, create expiration record
		if (input.expiresAt && status === "confirmed") {
			await trx.insert(schema.pointsExpiration).values({
				organizationId: input.organizationId,
				userBonusAccountId: account.id,
				bonusTransactionId: transaction.id,
				points: input.points,
				remainingPoints: input.points,
				expiresAt: input.expiresAt,
			});
		}

		return transaction;
	});
}

/**
 * Deduct points from user (for redemptions)
 */
export async function deductPoints(
	userId: string,
	organizationId: string,
	bonusProgramId: string,
	points: number,
	type: TBonusTransactionType,
	description?: string,
	metadata?: Record<string, unknown>,
	tx?: TransactionDb,
) {
	return await (tx || db).transaction(async (trx) => {
		// Get user account
		const account = await trx.query.userBonusAccount.findFirst({
			where: and(
				eq(schema.userBonusAccount.userId, userId),
				eq(schema.userBonusAccount.bonusProgramId, bonusProgramId),
			),
		});

		if (!account) {
			throw new Error("User bonus account not found");
		}

		const currentPoints = Number(account.currentPoints);
		if (currentPoints < points) {
			throw new Error(
				`Insufficient points. Available: ${currentPoints}, Required: ${points}`,
			);
		}

		const balanceBefore = currentPoints;
		const balanceAfter = currentPoints - points;

		// Update account
		await trx
			.update(schema.userBonusAccount)
			.set({
				currentPoints: balanceAfter,
				totalRedeemedPoints: Number(account.totalRedeemedPoints) + points,
				lastRedeemedAt: new Date(),
			})
			.where(eq(schema.userBonusAccount.id, account.id));

		// Handle FIFO expiration - deduct from oldest points first
		await handleFIFODeduction(account.id, points, trx);

		// Create transaction record
		const [transaction] = await trx
			.insert(schema.bonusTransaction)
			.values({
				organizationId,
				userBonusAccountId: account.id,
				type,
				points: -points, // Negative for deduction
				balanceBefore,
				balanceAfter,
				description,
				status: "confirmed",
				metadata,
			})
			.returning();

		return transaction;
	});
}

/**
 * Handle FIFO deduction from points expiration records
 */
async function handleFIFODeduction(
	accountId: string,
	pointsToDeduct: number,
	tx: TransactionDb,
) {
	// Get unexpired points ordered by expiration date (FIFO)
	const expirationRecords = await tx.query.pointsExpiration.findMany({
		where: and(
			eq(schema.pointsExpiration.userBonusAccountId, accountId),
			eq(schema.pointsExpiration.isExpired, false),
			sql`${schema.pointsExpiration.remainingPoints} > 0`,
		),
		orderBy: [schema.pointsExpiration.expiresAt],
	});

	let remaining = pointsToDeduct;

	for (const record of expirationRecords) {
		if (remaining <= 0) break;

		const recordPoints = Number(record.remainingPoints);
		const deductFromRecord = Math.min(recordPoints, remaining);

		await tx
			.update(schema.pointsExpiration)
			.set({
				remainingPoints: recordPoints - deductFromRecord,
			})
			.where(eq(schema.pointsExpiration.id, record.id));

		remaining -= deductFromRecord;
	}
}

/**
 * Confirm pending points (move from pending to current)
 */
export async function confirmPendingPoints(
	transactionId: string,
	organizationId: string,
	tx?: TransactionDb,
) {
	return await (tx || db).transaction(async (trx) => {
		// Get transaction
		const transaction = await trx.query.bonusTransaction.findFirst({
			where: and(
				eq(schema.bonusTransaction.id, transactionId),
				eq(schema.bonusTransaction.organizationId, organizationId),
			),
		});

		if (!transaction) {
			throw new Error("Transaction not found");
		}

		if (transaction.status !== "pending") {
			throw new Error("Transaction is not pending");
		}

		// Get user bonus account
		const account = await trx.query.userBonusAccount.findFirst({
			where: eq(schema.userBonusAccount.id, transaction.userBonusAccountId),
		});

		if (!account) {
			throw new Error("User bonus account not found");
		}

		// Update account balances
		const newCurrent = Number(account.currentPoints) + transaction.points;
		const newPending = Number(account.pendingPoints) - transaction.points;

		await trx
			.update(schema.userBonusAccount)
			.set({
				currentPoints: newCurrent,
				pendingPoints: Math.max(0, newPending),
				totalEarnedPoints:
					Number(account.totalEarnedPoints) + transaction.points,
				lastEarnedAt: new Date(),
			})
			.where(eq(schema.userBonusAccount.id, account.id));

		// Update transaction status
		const [updated] = await trx
			.update(schema.bonusTransaction)
			.set({
				status: "confirmed",
				balanceAfter: newCurrent,
			})
			.where(eq(schema.bonusTransaction.id, transactionId))
			.returning();

		return updated;
	});
}

/**
 * Cancel pending points
 */
export async function cancelPendingPoints(
	transactionId: string,
	organizationId: string,
	tx?: TransactionDb,
) {
	return await (tx || db).transaction(async (trx) => {
		// Get transaction
		const transaction = await trx.query.bonusTransaction.findFirst({
			where: and(
				eq(schema.bonusTransaction.id, transactionId),
				eq(schema.bonusTransaction.organizationId, organizationId),
			),
		});

		if (!transaction) {
			throw new Error("Transaction not found");
		}

		if (transaction.status !== "pending") {
			throw new Error("Transaction is not pending");
		}

		// Get user bonus account
		const account = await trx.query.userBonusAccount.findFirst({
			where: eq(schema.userBonusAccount.id, transaction.userBonusAccountId),
		});

		if (!account) {
			throw new Error("User bonus account not found");
		}

		// Update account balances
		const newPending = Number(account.pendingPoints) - transaction.points;

		await trx
			.update(schema.userBonusAccount)
			.set({
				pendingPoints: Math.max(0, newPending),
			})
			.where(eq(schema.userBonusAccount.id, account.id));

		// Update transaction status
		const [updated] = await trx
			.update(schema.bonusTransaction)
			.set({
				status: "canceled",
			})
			.where(eq(schema.bonusTransaction.id, transactionId))
			.returning();

		return updated;
	});
}

/**
 * Get user's points balance
 */
export async function getPointsBalance(userId: string, bonusProgramId: string) {
	const account = await db.query.userBonusAccount.findFirst({
		where: and(
			eq(schema.userBonusAccount.userId, userId),
			eq(schema.userBonusAccount.bonusProgramId, bonusProgramId),
		),
		with: {
			currentTier: true,
		},
	});

	if (!account) {
		return {
			currentPoints: 0,
			pendingPoints: 0,
			totalEarnedPoints: 0,
			totalRedeemedPoints: 0,
			totalExpiredPoints: 0,
			currentTier: null,
			nextTier: null,
		};
	}

	return {
		currentPoints: Number(account.currentPoints),
		pendingPoints: Number(account.pendingPoints),
		totalEarnedPoints: Number(account.totalEarnedPoints),
		totalRedeemedPoints: Number(account.totalRedeemedPoints),
		totalExpiredPoints: Number(account.totalExpiredPoints),
		currentTier: account.currentTier,
		nextTier: null as { name: string; minPoints: number } | null,
	};
}

/**
 * Get user's transaction history
 */
export async function getTransactionHistory(
	userId: string,
	bonusProgramId: string,
	limit = 20,
	offset = 0,
) {
	// Get user account
	const account = await db.query.userBonusAccount.findFirst({
		where: and(
			eq(schema.userBonusAccount.userId, userId),
			eq(schema.userBonusAccount.bonusProgramId, bonusProgramId),
		),
	});

	if (!account) {
		return { transactions: [], total: 0 };
	}

	// Get transactions
	const transactions = await db.query.bonusTransaction.findMany({
		where: eq(schema.bonusTransaction.userBonusAccountId, account.id),
		orderBy: [desc(schema.bonusTransaction.createdAt)],
		limit,
		offset,
	});

	// Get total count
	const [countResult] = await db
		.select({ count: sql<number>`count(*)` })
		.from(schema.bonusTransaction)
		.where(eq(schema.bonusTransaction.userBonusAccountId, account.id));

	return {
		transactions,
		total: Number(countResult?.count || 0),
	};
}

/**
 * Expire points that have passed their expiration date
 */
export async function expirePoints() {
	return await db.transaction(async (trx) => {
		const now = new Date();

		// Find all expired points that haven't been processed
		const expiredRecords = await trx.query.pointsExpiration.findMany({
			where: and(
				eq(schema.pointsExpiration.isExpired, false),
				sql`${schema.pointsExpiration.expiresAt} <= ${now}`,
				sql`${schema.pointsExpiration.remainingPoints} > 0`,
			),
		});

		let totalExpired = 0;

		for (const record of expiredRecords) {
			const pointsToExpire = Number(record.remainingPoints);

			// Get user account
			const account = await trx.query.userBonusAccount.findFirst({
				where: eq(schema.userBonusAccount.id, record.userBonusAccountId),
			});

			if (!account) continue;

			// Update account
			await trx
				.update(schema.userBonusAccount)
				.set({
					currentPoints: Math.max(
						0,
						Number(account.currentPoints) - pointsToExpire,
					),
					totalExpiredPoints:
						Number(account.totalExpiredPoints) + pointsToExpire,
				})
				.where(eq(schema.userBonusAccount.id, account.id));

			// Mark expiration record as expired
			await trx
				.update(schema.pointsExpiration)
				.set({
					isExpired: true,
					expiredAt: now,
					remainingPoints: 0,
				})
				.where(eq(schema.pointsExpiration.id, record.id));

			// Create expiration transaction
			await trx.insert(schema.bonusTransaction).values({
				organizationId: record.organizationId,
				userBonusAccountId: account.id,
				type: "expired",
				points: -pointsToExpire,
				balanceBefore: Number(account.currentPoints),
				balanceAfter: Number(account.currentPoints) - pointsToExpire,
				description: "Points expired",
				status: "confirmed",
			});

			totalExpired += pointsToExpire;
		}

		return {
			expiredRecords: expiredRecords.length,
			totalPointsExpired: totalExpired,
		};
	});
}
