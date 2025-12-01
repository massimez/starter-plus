import { sql } from "drizzle-orm";
import {
	boolean,
	decimal,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { softAudit } from "../helpers/common";
import type {
	TBonusTransactionType,
	TCouponStatus,
	TRewardType,
} from "../helpers/types";
import { organization } from "../organization";
import { user } from "../user";
import { order } from "./order";

/**
 * ---------------------------------------------------------------------------
 * BONUS PROGRAM CONFIGURATION
 * ---------------------------------------------------------------------------
 */
export const bonusProgram = pgTable(
	"bonus_program",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		name: varchar("name", { length: 255 }).notNull(),
		description: text("description"),
		pointsPerDollar: decimal("points_per_dollar", {
			precision: 12,
			scale: 2,
		}).default("1.00"),
		minOrderAmount: decimal("min_order_amount", {
			precision: 12,
			scale: 2,
		}).default("0.00"),
		maxPointsPerOrder: integer("max_points_per_order"),
		pointsExpireDays: integer("points_expire_days"),
		signupBonus: integer("signup_bonus").default(0),
		referralBonusReferrer: integer("referral_bonus_referrer").default(0),
		referralBonusReferee: integer("referral_bonus_referee").default(0),
		isActive: boolean("is_active").default(true),
		metadata: jsonb("metadata"),
		...softAudit,
	},
	(table) => [index("bonus_program_org_idx").on(table.organizationId)],
);

/**
 * ---------------------------------------------------------------------------
 * TIER SYSTEM
 * ---------------------------------------------------------------------------
 */
export const bonusTier = pgTable(
	"bonus_tier",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		bonusProgramId: uuid("bonus_program_id")
			.notNull()
			.references(() => bonusProgram.id, { onDelete: "cascade" }),
		name: varchar("name", { length: 100 }).notNull(),
		slug: varchar("slug", { length: 100 }).notNull(),
		minPoints: integer("min_points").notNull(),
		multiplier: decimal("multiplier", { precision: 5, scale: 2 }).default(
			"1.00",
		),
		description: text("description"),
		benefits: jsonb("benefits"), // Array of benefits
		isActive: boolean("is_active").default(true),
		sortOrder: integer("sort_order").default(0),
		...softAudit,
	},
	(table) => [
		index("bonus_tier_program_idx").on(table.bonusProgramId),
		uniqueIndex("bonus_tier_slug_org_idx").on(table.slug, table.organizationId),
	],
);

/**
 * ---------------------------------------------------------------------------
 * USER BONUS ACCOUNT (New comprehensive system)
 * ---------------------------------------------------------------------------
 */
export const userBonusAccount = pgTable(
	"user_bonus_account",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		bonusProgramId: uuid("bonus_program_id")
			.notNull()
			.references(() => bonusProgram.id, { onDelete: "cascade" }),
		currentPoints: integer("current_points").default(0).notNull(),
		pendingPoints: integer("pending_points").default(0).notNull(),
		totalEarnedPoints: integer("total_earned_points").default(0).notNull(),
		totalRedeemedPoints: integer("total_redeemed_points").default(0).notNull(),
		totalExpiredPoints: integer("total_expired_points").default(0).notNull(),
		currentTierId: uuid("current_tier_id").references(() => bonusTier.id),
		tierProgress: decimal("tier_progress", {
			precision: 5,
			scale: 2,
		}).default("0.00"),
		lastEarnedAt: timestamp("last_earned_at"),
		lastRedeemedAt: timestamp("last_redeemed_at"),
		isActive: boolean("is_active").default(true),
		...softAudit,
	},
	(table) => [
		uniqueIndex("user_bonus_account_user_program_idx").on(
			table.userId,
			table.bonusProgramId,
		),
		index("user_bonus_account_org_idx").on(table.organizationId),
	],
);

/**
 * ---------------------------------------------------------------------------
 * BONUS TRANSACTION LEDGER
 * ---------------------------------------------------------------------------
 */
export const bonusTransaction = pgTable(
	"bonus_transaction",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		userBonusAccountId: uuid("user_bonus_account_id")
			.notNull()
			.references(() => userBonusAccount.id, { onDelete: "cascade" }),
		type: text("type").notNull().$type<TBonusTransactionType>(),
		points: integer("points").notNull(),
		balanceBefore: integer("balance_before").notNull(),
		balanceAfter: integer("balance_after").notNull(),
		orderId: uuid("order_id").references(() => order.id),
		description: text("description"),
		status: text("status")
			.default("pending")
			.notNull()
			.$type<"pending" | "confirmed" | "canceled">(),
		expiresAt: timestamp("expires_at"),
		metadata: jsonb("metadata"),
		...softAudit,
	},
	(table) => [
		index("bonus_transaction_account_idx").on(table.userBonusAccountId),
		index("bonus_transaction_order_idx").on(table.orderId),
		index("bonus_transaction_status_idx").on(table.status),
	],
);

/**
 * ---------------------------------------------------------------------------
 * REWARD CATALOG
 * ---------------------------------------------------------------------------
 */
export const reward = pgTable(
	"reward",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		bonusProgramId: uuid("bonus_program_id")
			.notNull()
			.references(() => bonusProgram.id, { onDelete: "cascade" }),
		name: varchar("name", { length: 255 }).notNull(),
		description: text("description"),
		type: text("type").notNull().$type<TRewardType>(),
		pointsCost: integer("points_cost").notNull(),
		cashAmount: decimal("cash_amount", { precision: 12, scale: 2 }),
		discountPercentage: decimal("discount_percentage", {
			precision: 5,
			scale: 2,
		}),
		discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }),
		minOrderAmount: decimal("min_order_amount", { precision: 12, scale: 2 }),
		maxRedemptionsPerUser: integer("max_redemptions_per_user"),
		totalRedemptionsLimit: integer("total_redemptions_limit"),
		currentRedemptions: integer("current_redemptions").default(0),
		validFrom: timestamp("valid_from"),
		validUntil: timestamp("valid_until"),
		image: varchar("image", { length: 255 }),
		sortOrder: integer("sort_order").default(0),
		isActive: boolean("is_active").default(true),
		metadata: jsonb("metadata"),
		...softAudit,
	},
	(table) => [
		index("reward_program_idx").on(table.bonusProgramId),
		index("reward_active_idx").on(table.isActive),
	],
);

/**
 * ---------------------------------------------------------------------------
 * BONUS COUPONS
 * ---------------------------------------------------------------------------
 */
export const bonusCoupon = pgTable(
	"bonus_coupon",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		rewardId: uuid("reward_id")
			.notNull()
			.references(() => reward.id, { onDelete: "cascade" }),
		bonusTransactionId: uuid("bonus_transaction_id")
			.notNull()
			.references(() => bonusTransaction.id, { onDelete: "cascade" }),
		code: varchar("code", { length: 50 }).notNull().unique(),
		type: text("type").notNull().$type<TRewardType>(),
		discountPercentage: decimal("discount_percentage", {
			precision: 5,
			scale: 2,
		}),
		discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }),
		minOrderAmount: decimal("min_order_amount", { precision: 12, scale: 2 }),
		status: text("status").default("active").notNull().$type<TCouponStatus>(),
		expiresAt: timestamp("expires_at").notNull(),
		usedAt: timestamp("used_at"),
		usedInOrderId: uuid("used_in_order_id").references(() => order.id),
		...softAudit,
	},
	(table) => [
		index("bonus_coupon_user_idx").on(table.userId),
		index("bonus_coupon_status_idx").on(table.status),
		uniqueIndex("bonus_coupon_code_idx").on(table.code),
	],
);

/**
 * ---------------------------------------------------------------------------
 * REFERRAL SYSTEM
 * ---------------------------------------------------------------------------
 */
export const referral = pgTable(
	"referral",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		bonusProgramId: uuid("bonus_program_id")
			.notNull()
			.references(() => bonusProgram.id, { onDelete: "cascade" }),
		referrerId: text("referrer_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		referredUserId: text("referred_user_id").references(() => user.id, {
			onDelete: "set null",
		}),
		referralCode: varchar("referral_code", { length: 50 }).notNull().unique(),
		signedUpAt: timestamp("signed_up_at"),
		referrerBonusGiven: boolean("referrer_bonus_given").default(false),
		referrerTransactionId: uuid("referrer_transaction_id").references(
			() => bonusTransaction.id,
		),
		refereeBonusGiven: boolean("referee_bonus_given").default(false),
		refereeTransactionId: uuid("referee_transaction_id").references(
			() => bonusTransaction.id,
		),
		isActive: boolean("is_active").default(true),
		metadata: jsonb("metadata"),
		...softAudit,
	},
	(table) => [
		index("referral_referrer_idx").on(table.referrerId),
		index("referral_referred_idx").on(table.referredUserId),
		uniqueIndex("referral_code_idx").on(table.referralCode),
	],
);

/**
 * ---------------------------------------------------------------------------
 * MILESTONE SYSTEM
 * ---------------------------------------------------------------------------
 */
export const bonusMilestone = pgTable(
	"bonus_milestone",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		bonusProgramId: uuid("bonus_program_id")
			.notNull()
			.references(() => bonusProgram.id, { onDelete: "cascade" }),
		name: varchar("name", { length: 255 }).notNull(),
		description: text("description"),
		type: text("type")
			.notNull()
			.$type<
				| "first_purchase"
				| "total_spent"
				| "order_count"
				| "product_review"
				| "referral_count"
				| "custom"
			>(),
		targetValue: decimal("target_value", { precision: 12, scale: 2 }).notNull(),
		rewardPoints: integer("reward_points").notNull(),
		isRepeatable: boolean("is_repeatable").default(false),
		isActive: boolean("is_active").default(true),
		sortOrder: integer("sort_order").default(0),
		metadata: jsonb("metadata"),
		...softAudit,
	},
	(table) => [
		index("bonus_milestone_program_idx").on(table.bonusProgramId),
		index("bonus_milestone_active_idx").on(table.isActive),
	],
);

/**
 * ---------------------------------------------------------------------------
 * USER MILESTONE PROGRESS
 * ---------------------------------------------------------------------------
 */
export const userMilestoneProgress = pgTable(
	"user_milestone_progress",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		milestoneId: uuid("milestone_id")
			.notNull()
			.references(() => bonusMilestone.id, { onDelete: "cascade" }),
		currentValue: decimal("current_value", {
			precision: 12,
			scale: 2,
		}).default("0"),
		isCompleted: boolean("is_completed").default(false),
		completedAt: timestamp("completed_at"),
		completionCount: integer("completion_count").default(0),
		bonusTransactionId: uuid("bonus_transaction_id").references(
			() => bonusTransaction.id,
		),
		...softAudit,
	},
	(table) => [
		uniqueIndex("user_milestone_progress_user_milestone_idx").on(
			table.userId,
			table.milestoneId,
		),
		index("user_milestone_progress_completed_idx").on(table.isCompleted),
	],
);

/**
 * ---------------------------------------------------------------------------
 * POINTS EXPIRATION TRACKING
 * ---------------------------------------------------------------------------
 */
export const pointsExpiration = pgTable(
	"points_expiration",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		userBonusAccountId: uuid("user_bonus_account_id")
			.notNull()
			.references(() => userBonusAccount.id, { onDelete: "cascade" }),
		bonusTransactionId: uuid("bonus_transaction_id")
			.notNull()
			.references(() => bonusTransaction.id, { onDelete: "cascade" }),
		points: integer("points").notNull(),
		remainingPoints: integer("remaining_points").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		isExpired: boolean("is_expired").default(false),
		expiredAt: timestamp("expired_at"),
		...softAudit,
	},
	(table) => [
		index("points_expiration_account_idx").on(table.userBonusAccountId),
		index("points_expiration_expires_idx").on(table.expiresAt),
		index("points_expiration_expired_idx").on(table.isExpired),
	],
);
