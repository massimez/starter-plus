import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { TransactionDb } from "@/types/db";
import { awardPoints } from "./points.service";

/**
 * ---------------------------------------------------------------------------
 * REFERRAL SERVICE
 * Manages referral codes and bonus attribution
 * ---------------------------------------------------------------------------
 */

/**
 * Generate unique referral code
 */
function generateReferralCode(userId: string): string {
	const timestamp = Date.now().toString(36);
	const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
	const userHash = userId.substring(0, 4).toUpperCase();
	return `${userHash}${timestamp}${randomStr}`.substring(0, 12);
}

/**
 * Get or create referral code for user
 */
export async function getOrCreateReferralCode(
	userId: string,
	organizationId: string,
	bonusProgramId: string,
) {
	// Check if user already has a referral code
	let referral = await db.query.referral.findFirst({
		where: and(
			eq(schema.referral.referrerId, userId),
			eq(schema.referral.bonusProgramId, bonusProgramId),
			eq(schema.referral.isActive, true),
		),
	});

	// Create if doesn't exist
	if (!referral) {
		const code = generateReferralCode(userId);

		const [newReferral] = await db
			.insert(schema.referral)
			.values({
				organizationId,
				bonusProgramId,
				referrerId: userId,
				referralCode: code,
			})
			.returning();

		referral = newReferral;
	}

	return referral;
}

/**
 * Validate referral code
 */
export async function validateReferralCode(
	code: string,
	organizationId: string,
) {
	const referral = await db.query.referral.findFirst({
		where: and(
			eq(schema.referral.referralCode, code),
			eq(schema.referral.organizationId, organizationId),
			eq(schema.referral.isActive, true),
		),
		with: {
			referrer: true,
			bonusProgram: true,
		},
	});

	return referral;
}

/**
 * Track referral when new user signs up
 */
export async function trackReferral(
	referralCode: string,
	referredUserId: string,
	organizationId: string,
	tx?: TransactionDb,
) {
	return await (tx || db).transaction(async (trx) => {
		// Find referral by code
		const referral = await trx.query.referral.findFirst({
			where: and(
				eq(schema.referral.referralCode, referralCode),
				eq(schema.referral.organizationId, organizationId),
			),
		});

		if (!referral) {
			throw new Error("Invalid referral code");
		}

		// Update referral with referred user
		const [updated] = await trx
			.update(schema.referral)
			.set({
				referredUserId,
				signedUpAt: new Date(),
			})
			.where(eq(schema.referral.id, referral.id))
			.returning();

		return updated;
	});
}

/**
 * Award referral bonuses to both referrer and referee
 */
export async function awardReferralBonuses(
	referralId: string,
	tx?: TransactionDb,
) {
	return await (tx || db).transaction(async (trx) => {
		// Get referral with program details
		const referral = await trx.query.referral.findFirst({
			where: eq(schema.referral.id, referralId),
			with: {
				bonusProgram: true,
			},
		});

		if (!referral || !referral.referredUserId) {
			throw new Error("Referral not found or incomplete");
		}

		const program = referral.bonusProgram;

		// Award bonus to referrer
		if (
			!referral.referrerBonusGiven &&
			program.referralBonusReferrer &&
			program.referralBonusReferrer > 0
		) {
			const referrerTransaction = await awardPoints(
				{
					userId: referral.referrerId,
					organizationId: referral.organizationId,
					bonusProgramId: referral.bonusProgramId,
					points: program.referralBonusReferrer,
					type: "earned_referral",
					description: "Referral bonus for referring user",
					status: "confirmed",
				},
				trx,
			);

			await trx
				.update(schema.referral)
				.set({
					referrerBonusGiven: true,
					referrerTransactionId: referrerTransaction.id,
				})
				.where(eq(schema.referral.id, referralId));
		}

		// Award bonus to referee
		if (
			!referral.refereeBonusGiven &&
			program.referralBonusReferee &&
			program.referralBonusReferee > 0
		) {
			const refereeTransaction = await awardPoints(
				{
					userId: referral.referredUserId,
					organizationId: referral.organizationId,
					bonusProgramId: referral.bonusProgramId,
					points: program.referralBonusReferee,
					type: "earned_referral",
					description: "Welcome bonus for joining via referral",
					status: "confirmed",
				},
				trx,
			);

			await trx
				.update(schema.referral)
				.set({
					refereeBonusGiven: true,
					refereeTransactionId: refereeTransaction.id,
				})
				.where(eq(schema.referral.id, referralId));
		}

		return referral;
	});
}

/**
 * Get referral statistics for user
 */
export async function getReferralStats(
	userId: string,
	bonusProgramId: string,
	organizationId: string,
) {
	// Get or create the user's referral code
	const userReferral = await getOrCreateReferralCode(
		userId,
		organizationId,
		bonusProgramId,
	);

	// Get all referrals made by this user
	const referrals = await db.query.referral.findMany({
		where: and(
			eq(schema.referral.referrerId, userId),
			eq(schema.referral.bonusProgramId, bonusProgramId),
		),
	});

	// Total referrals = successful referrals (where someone actually signed up)
	const totalReferrals = referrals.filter((r) => r.signedUpAt).length;
	const successfulReferrals = totalReferrals; // These are the same - successful = completed
	const bonusesEarned = referrals.filter((r) => r.referrerBonusGiven).length;

	return {
		referralCode: userReferral.referralCode,
		totalReferrals,
		successfulReferrals,
		bonusesEarned,
		referrals,
	};
}

/**
 * Get all referrals for a bonus program (admin)
 */
export async function getReferralsByProgram(
	bonusProgramId: string,
	organizationId: string,
) {
	// Get all referrals for this program
	const referrals = await db.query.referral.findMany({
		where: and(
			eq(schema.referral.bonusProgramId, bonusProgramId),
			eq(schema.referral.organizationId, organizationId),
		),
		with: {
			referrer: {
				columns: {
					id: true,
					name: true,
					email: true,
				},
			},
			referredUser: {
				columns: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
		orderBy: (referral, { desc }) => [desc(referral.createdAt)],
	});

	// Calculate aggregate statistics
	const totalReferrals = referrals.length;
	const successfulReferrals = referrals.filter((r) => r.signedUpAt).length;
	const pendingReferrals = totalReferrals - successfulReferrals;
	const referrerBonusesAwarded = referrals.filter(
		(r) => r.referrerBonusGiven,
	).length;
	const refereeBonusesAwarded = referrals.filter(
		(r) => r.refereeBonusGiven,
	).length;

	return {
		referrals,
		stats: {
			totalReferrals,
			successfulReferrals,
			pendingReferrals,
			referrerBonusesAwarded,
			refereeBonusesAwarded,
		},
	};
}
