import { decimal, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { softAudit } from "../helpers/common";

import { organization } from "../organization";
import { user } from "../user";

export const userBonus = pgTable(
	"user_bonus",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		bonus: decimal("bonus", { precision: 10, scale: 2 }).default("0"),
		bonusPending: decimal("bonus_pending", { precision: 10, scale: 2 }).default(
			"0",
		),
		...softAudit,
	},
	(table) => [
		uniqueIndex("user_bonus_user_org_idx").on(
			table.userId,
			table.organizationId,
		),
	],
);

// export const bonusProgram = pgTable("bonus_program", {
// 	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
// 	organizationId: text("organization_id")
// 		.notNull()
// 		.references(() => organization.id, { onDelete: "cascade" }),
// 	name: varchar("name", { length: 255 }).notNull(),
// 	description: text("description"),
// 	pointsPerDollar: decimal("points_per_dollar", {
// 		precision: 12,
// 		scale: 2,
// 	}).default("1.00"),
// 	minOrderAmount: decimal("min_order_amount", {
// 		precision: 12,
// 		scale: 2,
// 	}).default("0.00"),
// 	maxPointsPerOrder: integer("max_points_per_order"),
// 	pointsExpireDays: integer("points_expire_days"),
// 	signupBonus: integer("signup_bonus").default(0),
// 	referralBonus: integer("referral_bonus").default(0),
// 	isActive: boolean("is_active").default(true),
// 	...softAudit,
// });

// export const bonusTier = pgTable("bonus_tier", {
// 	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
// 	organizationId: text("organization_id")
// 		.notNull()
// 		.references(() => organization.id, { onDelete: "cascade" }),
// 	bonusProgramId: uuid("bonus_program_id")
// 		.notNull()
// 		.references(() => bonusProgram.id, { onDelete: "cascade" }),
// 	name: varchar("name", { length: 100 }).notNull(),
// 	slug: varchar("slug", { length: 100 }).notNull().unique(),
// 	minPoints: integer("min_points").notNull(),
// 	multiplier: decimal("multiplier", { precision: 5, scale: 2 }).default("1.00"),
// 	description: text("description"),
// 	isActive: boolean("is_active").default(true),
// 	...softAudit,
// });

// export const userBonusAccount = pgTable("user_bonus_account", {
// 	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
// 	organizationId: text("organization_id")
// 		.notNull()
// 		.references(() => organization.id, { onDelete: "cascade" }),
// 	userId: text("user_id")
// 		.notNull()
// 		.references(() => user.id, { onDelete: "cascade" }),
// 	bonusProgramId: uuid("bonus_program_id")
// 		.notNull()
// 		.references(() => bonusProgram.id, { onDelete: "cascade" }),
// 	currentPoints: integer("current_points").default(0).notNull(),
// 	pendingPoints: integer("pending_points").default(0).notNull(), // New field for pending points
// 	totalEarnedPoints: integer("total_earned_points").default(0).notNull(),
// 	totalRedeemedPoints: integer("total_redeemed_points").default(0).notNull(),
// 	totalExpiredPoints: integer("total_expired_points").default(0).notNull(),
// 	currentTier: varchar("current_tier", { length: 100 }),
// 	tierProgress: decimal("tier_progress", {
// 		precision: 5,
// 		scale: 2,
// 	}).default("0.00"),
// 	lastEarnedAt: timestamp("last_earned_at"),
// 	lastRedeemedAt: timestamp("last_redeemed_at"),
// 	isActive: boolean("is_active").default(true),
// 	...softAudit,
// });

// export const bonusTransaction = pgTable("bonus_transaction", {
// 	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
// 	organizationId: text("organization_id")
// 		.notNull()
// 		.references(() => organization.id, { onDelete: "cascade" }),
// 	userBonusAccountId: uuid("user_bonus_account_id")
// 		.notNull()
// 		.references(() => userBonusAccount.id, { onDelete: "cascade" }),
// 	type: text("type").notNull().$type<TBonusTransactionType>(),
// 	points: integer("points").notNull(),
// 	balanceBefore: integer("balance_before").notNull(),
// 	balanceAfter: integer("balance_after").notNull(),
// 	orderId: uuid("order_id").references(() => order.id),
// 	description: text("description"),
// 	status: text("status")
// 		.default("pending")
// 		.notNull()
// 		.$type<"pending" | "confirmed" | "canceled">(),
// 	expiresAt: timestamp("expires_at"),
// 	metadata: jsonb("metadata"),
// 	...softAudit,
// });

// export const reward = pgTable("reward", {
// 	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
// 	organizationId: text("organization_id")
// 		.notNull()
// 		.references(() => organization.id, { onDelete: "cascade" }),
// 	name: varchar("name", { length: 255 }).notNull(),
// 	description: text("description"),
// 	type: text("type").notNull().$type<TRewardType>(),
// 	pointsCost: integer("points_cost").notNull(),
// 	cashAmount: decimal("cash_amount", { precision: 12, scale: 2 }),
// 	discountPercentage: decimal("discount_percentage", {
// 		precision: 5,
// 		scale: 2,
// 	}),
// 	discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }),
// 	minOrderAmount: decimal("min_order_amount", { precision: 12, scale: 2 }),
// 	maxRedemptionsPerUser: integer("max_redemptions_per_user"),
// 	totalRedemptionsLimit: integer("total_redemptions_limit"),
// 	currentRedemptions: integer("current_redemptions").default(0),
// 	validFrom: timestamp("valid_from"),
// 	validUntil: timestamp("valid_until"),
// 	image: varchar("image", { length: 255 }),
// 	sortOrder: integer("sort_order").default(0),
// 	isActive: boolean("is_active").default(true),
// 	...softAudit,
// });

// export const bonusCoupon = pgTable("bonus_coupon", {
// 	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
// 	organizationId: text("organization_id")
// 		.notNull()
// 		.references(() => organization.id, { onDelete: "cascade" }),
// 	userId: text("user_id")
// 		.notNull()
// 		.references(() => user.id, { onDelete: "cascade" }),
// 	rewardId: uuid("reward_id")
// 		.notNull()
// 		.references(() => reward.id, { onDelete: "cascade" }),
// 	bonusTransactionId: uuid("bonus_transaction_id")
// 		.notNull()
// 		.references(() => bonusTransaction.id, { onDelete: "cascade" }),
// 	code: varchar("code", { length: 50 }).notNull().unique(),
// 	type: text("type").notNull().$type<TRewardType>(),
// 	discountPercentage: decimal("discount_percentage", {
// 		precision: 5,
// 		scale: 2,
// 	}),
// 	discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }),
// 	minOrderAmount: decimal("min_order_amount", { precision: 12, scale: 2 }),
// 	status: text("status").default("active").notNull().$type<TCouponStatus>(),
// 	expiresAt: timestamp("expires_at").notNull(),
// 	usedAt: timestamp("used_at"),
// 	usedInOrderId: uuid("used_in_order_id").references(() => order.id),
// 	...softAudit,
// });

// export const referral = pgTable("referral", {
// 	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
// 	organizationId: text("organization_id")
// 		.notNull()
// 		.references(() => organization.id, { onDelete: "cascade" }),
// 	referrerId: text("referrer_id")
// 		.notNull()
// 		.references(() => user.id, { onDelete: "cascade" }),
// 	referredUserId: text("referred_user_id").references(() => user.id),
// 	referralCode: varchar("referral_code", { length: 50 }).notNull().unique(),
// 	signedUpAt: timestamp("signed_up_at"),
// 	referrerBonusGiven: boolean("referrer_bonus_given").default(false),
// 	referrerTransactionId: uuid("referrer_transaction_id").references(
// 		() => bonusTransaction.id,
// 	),
// 	isActive: boolean("is_active").default(true),
// 	...softAudit,
// });
