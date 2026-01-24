import { and, desc, eq, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { TransactionDb } from "@/types/db";

/**
 * ---------------------------------------------------------------------------
 * COUPON SERVICE
 * Manages coupon generation, validation, and usage
 * ---------------------------------------------------------------------------
 */

/**
 * Generate unique coupon code
 */
export async function generateUniqueCouponCode(): Promise<string> {
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let code: string;
	let isUnique = false;

	while (!isUnique) {
		// Generate code in format: XXXX-XXXX-XXXX
		code = "";
		for (let i = 0; i < 3; i++) {
			if (i > 0) code += "-";
			for (let j = 0; j < 4; j++) {
				code += characters.charAt(
					Math.floor(Math.random() * characters.length),
				);
			}
		}

		// Check if code already exists
		const existing = await db.query.bonusCoupon.findFirst({
			where: eq(schema.bonusCoupon.code, code),
		});

		if (!existing) {
			isUnique = true;
			return code;
		}
	}

	throw new Error("Failed to generate unique coupon code");
}

/**
 * Validate coupon code
 */
export async function validateCoupon(code: string, organizationId: string) {
	const coupon = await db.query.bonusCoupon.findFirst({
		where: and(
			eq(schema.bonusCoupon.code, code),
			eq(schema.bonusCoupon.organizationId, organizationId),
		),
		with: {
			reward: true,
		},
	});

	if (!coupon) {
		return {
			valid: false,
			error: "Coupon not found",
		};
	}

	// Check status
	if (coupon.status !== "active") {
		return {
			valid: false,
			error: `Coupon is ${coupon.status}`,
		};
	}

	// Check expiration
	const now = new Date();
	if (coupon.expiresAt < now) {
		// Auto-expire the coupon
		await db
			.update(schema.bonusCoupon)
			.set({ status: "expired" })
			.where(eq(schema.bonusCoupon.id, coupon.id));

		return {
			valid: false,
			error: "Coupon has expired",
		};
	}

	return {
		valid: true,
		coupon,
	};
}

/**
 * Apply coupon to order
 */
export async function applyCoupon(
	code: string,
	organizationId: string,
	orderTotal: number,
) {
	const validation = await validateCoupon(code, organizationId);

	if (!validation.valid || !validation.coupon) {
		throw new Error(validation.error || "Invalid coupon");
	}

	const coupon = validation.coupon;

	// Check minimum order amount
	if (coupon.minOrderAmount) {
		const minAmount = Number(coupon.minOrderAmount);
		if (orderTotal < minAmount) {
			throw new Error(
				`Minimum order amount of ${minAmount} required to use this coupon`,
			);
		}
	}

	// Calculate discount
	let discountAmount = 0;

	if (coupon.type === "percentage_discount" && coupon.discountPercentage) {
		const percentage = Number(coupon.discountPercentage);
		discountAmount = (orderTotal * percentage) / 100;
	} else if (coupon.type === "fixed_discount" && coupon.discountAmount) {
		discountAmount = Number(coupon.discountAmount);
	} else if (coupon.type === "cash_back" && coupon.reward?.cashAmount) {
		// Cash back coupons use the reward's cashAmount
		discountAmount = Number(coupon.reward.cashAmount);
	} else if (coupon.type === "free_shipping") {
		// Shipping discount would be calculated separately
		discountAmount = 0;
	}

	// Ensure discount doesn't exceed order total
	discountAmount = Math.min(discountAmount, orderTotal);

	return {
		coupon,
		discountAmount,
		finalTotal: orderTotal - discountAmount,
	};
}

/**
 * Mark coupon as used
 */
export async function markCouponAsUsed(
	couponId: string,
	orderId: string,
	tx?: TransactionDb,
) {
	const dbClient = tx || db;
	const [updated] = await dbClient
		.update(schema.bonusCoupon)
		.set({
			status: "used",
			usedAt: new Date(),
			usedInOrderId: orderId,
		})
		.where(eq(schema.bonusCoupon.id, couponId))
		.returning();

	return updated;
}

/**
 * Get user's coupons
 */
export async function getUserCoupons(
	userId: string,
	organizationId: string,
	includeUsed = false,
) {
	const conditions = [
		eq(schema.bonusCoupon.userId, userId),
		eq(schema.bonusCoupon.organizationId, organizationId),
	];

	if (!includeUsed) {
		const activeOrExpired = or(
			eq(schema.bonusCoupon.status, "active"),
			eq(schema.bonusCoupon.status, "expired"),
		);
		if (activeOrExpired) {
			conditions.push(activeOrExpired);
		}
	}

	const coupons = await db.query.bonusCoupon.findMany({
		where: and(...conditions),
		with: {
			reward: true,
		},
		orderBy: [desc(schema.bonusCoupon.createdAt)],
	});

	// Auto-expire expired coupons
	const now = new Date();
	const expiredCoupons = coupons.filter(
		(c) => c.status === "active" && c.expiresAt < now,
	);

	if (expiredCoupons.length > 0) {
		await db
			.update(schema.bonusCoupon)
			.set({ status: "expired" })
			.where(
				and(
					eq(schema.bonusCoupon.userId, userId),
					eq(schema.bonusCoupon.status, "active"),
					sql`${schema.bonusCoupon.expiresAt} < ${now}`,
				),
			);
	}

	return coupons.map((coupon) => ({
		...coupon,
		status:
			coupon.status === "active" && coupon.expiresAt < now
				? "expired"
				: coupon.status,
	}));
}

/**
 * Get coupon by ID
 */
export async function getCoupon(couponId: string, organizationId: string) {
	const coupon = await db.query.bonusCoupon.findFirst({
		where: and(
			eq(schema.bonusCoupon.id, couponId),
			eq(schema.bonusCoupon.organizationId, organizationId),
		),
		with: {
			reward: true,
		},
	});

	return coupon;
}

/**
 * Cancel coupon
 */
export async function cancelCoupon(couponId: string, organizationId: string) {
	const [canceled] = await db
		.update(schema.bonusCoupon)
		.set({ status: "cancelled" })
		.where(
			and(
				eq(schema.bonusCoupon.id, couponId),
				eq(schema.bonusCoupon.organizationId, organizationId),
				eq(schema.bonusCoupon.status, "active"),
			),
		)
		.returning();

	return canceled;
}
