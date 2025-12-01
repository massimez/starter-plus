import { relations } from "drizzle-orm";
import { organization } from "../organization";
import {
	bonusCoupon,
	bonusMilestone,
	bonusProgram,
	bonusTier,
	bonusTransaction,
	pointsExpiration,
	referral,
	reward,
	userBonusAccount,
	userMilestoneProgress,
} from "../store/bonus";
import { order } from "../store/order";
import { user } from "../user";

/**
 * ---------------------------------------------------------------------------
 * BONUS PROGRAM RELATIONS
 * ---------------------------------------------------------------------------
 */
export const bonusProgramRelations = relations(
	bonusProgram,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [bonusProgram.organizationId],
			references: [organization.id],
		}),
		tiers: many(bonusTier),
		userAccounts: many(userBonusAccount),
		rewards: many(reward),
		milestones: many(bonusMilestone),
		referrals: many(referral),
	}),
);

/**
 * ---------------------------------------------------------------------------
 * BONUS TIER RELATIONS
 * ---------------------------------------------------------------------------
 */
export const bonusTierRelations = relations(bonusTier, ({ one, many }) => ({
	organization: one(organization, {
		fields: [bonusTier.organizationId],
		references: [organization.id],
	}),
	bonusProgram: one(bonusProgram, {
		fields: [bonusTier.bonusProgramId],
		references: [bonusProgram.id],
	}),
	userAccounts: many(userBonusAccount),
}));

/**
 * ---------------------------------------------------------------------------
 * USER BONUS ACCOUNT RELATIONS
 * ---------------------------------------------------------------------------
 */
export const userBonusAccountRelations = relations(
	userBonusAccount,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [userBonusAccount.organizationId],
			references: [organization.id],
		}),
		user: one(user, {
			fields: [userBonusAccount.userId],
			references: [user.id],
		}),
		bonusProgram: one(bonusProgram, {
			fields: [userBonusAccount.bonusProgramId],
			references: [bonusProgram.id],
		}),
		currentTier: one(bonusTier, {
			fields: [userBonusAccount.currentTierId],
			references: [bonusTier.id],
		}),
		transactions: many(bonusTransaction),
		pointsExpirations: many(pointsExpiration),
	}),
);

/**
 * ---------------------------------------------------------------------------
 * BONUS TRANSACTION RELATIONS
 * ---------------------------------------------------------------------------
 */
export const bonusTransactionRelations = relations(
	bonusTransaction,
	({ one }) => ({
		organization: one(organization, {
			fields: [bonusTransaction.organizationId],
			references: [organization.id],
		}),
		userBonusAccount: one(userBonusAccount, {
			fields: [bonusTransaction.userBonusAccountId],
			references: [userBonusAccount.id],
		}),
		order: one(order, {
			fields: [bonusTransaction.orderId],
			references: [order.id],
		}),
	}),
);

/**
 * ---------------------------------------------------------------------------
 * REWARD RELATIONS
 * ---------------------------------------------------------------------------
 */
export const rewardRelations = relations(reward, ({ one, many }) => ({
	organization: one(organization, {
		fields: [reward.organizationId],
		references: [organization.id],
	}),
	bonusProgram: one(bonusProgram, {
		fields: [reward.bonusProgramId],
		references: [bonusProgram.id],
	}),
	coupons: many(bonusCoupon),
}));

/**
 * ---------------------------------------------------------------------------
 * BONUS COUPON RELATIONS
 * ---------------------------------------------------------------------------
 */
export const bonusCouponRelations = relations(bonusCoupon, ({ one }) => ({
	organization: one(organization, {
		fields: [bonusCoupon.organizationId],
		references: [organization.id],
	}),
	user: one(user, {
		fields: [bonusCoupon.userId],
		references: [user.id],
	}),
	reward: one(reward, {
		fields: [bonusCoupon.rewardId],
		references: [reward.id],
	}),
	bonusTransaction: one(bonusTransaction, {
		fields: [bonusCoupon.bonusTransactionId],
		references: [bonusTransaction.id],
	}),
	usedInOrder: one(order, {
		fields: [bonusCoupon.usedInOrderId],
		references: [order.id],
	}),
}));

/**
 * ---------------------------------------------------------------------------
 * REFERRAL RELATIONS
 * ---------------------------------------------------------------------------
 */
export const referralRelations = relations(referral, ({ one }) => ({
	organization: one(organization, {
		fields: [referral.organizationId],
		references: [organization.id],
	}),
	bonusProgram: one(bonusProgram, {
		fields: [referral.bonusProgramId],
		references: [bonusProgram.id],
	}),
	referrer: one(user, {
		fields: [referral.referrerId],
		references: [user.id],
		relationName: "referrer",
	}),
	referredUser: one(user, {
		fields: [referral.referredUserId],
		references: [user.id],
		relationName: "referredUser",
	}),
	referrerTransaction: one(bonusTransaction, {
		fields: [referral.referrerTransactionId],
		references: [bonusTransaction.id],
		relationName: "referrerTransaction",
	}),
	refereeTransaction: one(bonusTransaction, {
		fields: [referral.refereeTransactionId],
		references: [bonusTransaction.id],
		relationName: "refereeTransaction",
	}),
}));

/**
 * ---------------------------------------------------------------------------
 * MILESTONE RELATIONS
 * ---------------------------------------------------------------------------
 */
export const bonusMilestoneRelations = relations(
	bonusMilestone,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [bonusMilestone.organizationId],
			references: [organization.id],
		}),
		bonusProgram: one(bonusProgram, {
			fields: [bonusMilestone.bonusProgramId],
			references: [bonusProgram.id],
		}),
		userProgress: many(userMilestoneProgress),
	}),
);

/**
 * ---------------------------------------------------------------------------
 * USER MILESTONE PROGRESS RELATIONS
 * ---------------------------------------------------------------------------
 */
export const userMilestoneProgressRelations = relations(
	userMilestoneProgress,
	({ one }) => ({
		organization: one(organization, {
			fields: [userMilestoneProgress.organizationId],
			references: [organization.id],
		}),
		user: one(user, {
			fields: [userMilestoneProgress.userId],
			references: [user.id],
		}),
		milestone: one(bonusMilestone, {
			fields: [userMilestoneProgress.milestoneId],
			references: [bonusMilestone.id],
		}),
		bonusTransaction: one(bonusTransaction, {
			fields: [userMilestoneProgress.bonusTransactionId],
			references: [bonusTransaction.id],
		}),
	}),
);

/**
 * ---------------------------------------------------------------------------
 * POINTS EXPIRATION RELATIONS
 * ---------------------------------------------------------------------------
 */
export const pointsExpirationRelations = relations(
	pointsExpiration,
	({ one }) => ({
		organization: one(organization, {
			fields: [pointsExpiration.organizationId],
			references: [organization.id],
		}),
		userBonusAccount: one(userBonusAccount, {
			fields: [pointsExpiration.userBonusAccountId],
			references: [userBonusAccount.id],
		}),
		bonusTransaction: one(bonusTransaction, {
			fields: [pointsExpiration.bonusTransactionId],
			references: [bonusTransaction.id],
		}),
	}),
);
