import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { awardPoints } from "../../store/rewards/points.service";

export async function listPayoutRequests(
	organizationId: string,
	limit = 20,
	offset = 0,
	status?: "pending" | "approved" | "rejected" | "paid",
) {
	const where = and(
		eq(schema.payoutRequest.organizationId, organizationId),
		status ? eq(schema.payoutRequest.status, status) : undefined,
	);

	const requests = await db.query.payoutRequest.findMany({
		where,
		limit,
		offset,
		orderBy: [desc(schema.payoutRequest.createdAt)],
		with: {
			user: {
				columns: {
					id: true,
					email: true,
					firstName: true,
					lastName: true,
				},
			},
		},
	});

	const [total] = await db
		.select({ count: sql<number>`count(*)` })
		.from(schema.payoutRequest)
		.where(where);

	return {
		requests,
		total: Number(total?.count || 0),
	};
}

export async function approvePayoutRequest(
	payoutId: string,
	organizationId: string,
	adminId: string,
) {
	const [updated] = await db
		.update(schema.payoutRequest)
		.set({
			status: "approved",
			processedAt: new Date(),
			processedBy: adminId,
		})
		.where(
			and(
				eq(schema.payoutRequest.id, payoutId),
				eq(schema.payoutRequest.organizationId, organizationId),
				eq(schema.payoutRequest.status, "pending"),
			),
		)
		.returning();

	if (!updated) {
		throw new Error("Payout request not found or not pending");
	}

	return updated;
}

export async function rejectPayoutRequest(
	payoutId: string,
	organizationId: string,
	adminId: string,
	reason: string,
) {
	return await db.transaction(async (trx) => {
		// Get payout request
		const payout = await trx.query.payoutRequest.findFirst({
			where: and(
				eq(schema.payoutRequest.id, payoutId),
				eq(schema.payoutRequest.organizationId, organizationId),
				eq(schema.payoutRequest.status, "pending"),
			),
		});

		if (!payout) {
			throw new Error("Payout request not found or not pending");
		}

		// Update status
		const [updated] = await trx
			.update(schema.payoutRequest)
			.set({
				status: "rejected",
				processedAt: new Date(),
				processedBy: adminId,
				rejectionReason: reason,
			})
			.where(eq(schema.payoutRequest.id, payoutId))
			.returning();

		// Refund points
		const transaction = await trx.query.bonusTransaction.findFirst({
			where: eq(schema.bonusTransaction.id, payout.bonusTransactionId),
			with: {
				userBonusAccount: true,
			},
		});

		if (transaction?.userBonusAccount) {
			await awardPoints(
				{
					userId: payout.userId,
					organizationId,
					bonusProgramId: transaction.userBonusAccount.bonusProgramId,
					points: payout.pointsDeducted,
					type: "earned_manual",
					description: `Refund for rejected payout request: ${reason}`,
					metadata: { payoutRequestId: payout.id },
					status: "confirmed",
				},
				trx,
			);
		}

		return updated;
	});
}

export async function markPayoutPaid(
	payoutId: string,
	organizationId: string,
	adminId: string,
) {
	const [updated] = await db
		.update(schema.payoutRequest)
		.set({
			status: "paid",
			processedAt: new Date(),
			processedBy: adminId,
		})
		.where(
			and(
				eq(schema.payoutRequest.id, payoutId),
				eq(schema.payoutRequest.organizationId, organizationId),
				eq(schema.payoutRequest.status, "approved"),
			),
		)
		.returning();

	if (!updated) {
		throw new Error("Payout request not found or not approved");
	}

	return updated;
}
