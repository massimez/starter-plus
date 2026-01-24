import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { order, orderItem } from "@/lib/db/schema/store/order";
import { incrementClientUncompletedOrders } from "@/routes/admin-organization/store/client/client.service";
import { awardCashback } from "@/routes/admin-organization/store/rewards/cashback.service";
import type { TransactionDb } from "@/types/db";

// Types
type CreateOrderInput = {
	organizationId: string;
	shippingAddress: {
		street?: string;
		city: string;
		state: string;
		country?: string;
		postalCode?: string;
	};
	items: Array<{
		productVariantId: string;
		quantity: number;
		locationId: string;
	}>;
	currency: string;
	customerEmail?: string;
	customerPhone?: string;
	customerFullName?: string;
	locationId: string;
	userId?: string;
	couponCode?: string;
};

// Helper functions (legacy - kept for backward compatibility)
// This function is deprecated - use cashback.service instead

// Custom error for stock issues
class StockError extends Error {
	productName: string;
	sku: string;
	available: number;
	requested: number;

	constructor(
		productName: string,
		sku: string,
		available: number,
		requested: number,
	) {
		super(
			`Insufficient stock for product variant ${productName} (SKU: ${sku}). Available: ${available}, Requested: ${requested}. Backorders are not allowed.`,
		);
		this.name = "StockError";
		this.productName = productName;
		this.sku = sku;
		this.available = available;
		this.requested = requested;
	}
}

async function validateOrderItems(
	items: CreateOrderInput["items"],
	activeOrgId: string,
	tx: TransactionDb,
) {
	let subtotal = 0;
	const orderItemsToInsert = [];

	for (const item of items) {
		const foundProductVariant = await tx.query.productVariant.findFirst({
			where: eq(schema.productVariant.id, item.productVariantId),
			columns: {
				id: true,
				price: true,
				sku: true,
				productId: true,
			},
		});

		if (!foundProductVariant) {
			throw new Error(`Product variant not found: ${item.productVariantId}`);
		}

		const productInfo = await tx.query.product.findFirst({
			where: eq(schema.product.id, foundProductVariant.productId),
			columns: {
				allowBackorders: true,
				name: true,
				translations: true,
			},
		});

		const allowBackorders = productInfo?.allowBackorders || false;
		const productName =
			productInfo?.name ||
			productInfo?.translations?.[0]?.name ||
			"Unknown Product";
		const unitPrice = Number(foundProductVariant.price || 0);
		const totalPrice = unitPrice * Number(item.quantity || 0);
		subtotal += totalPrice;

		if (!item.locationId) {
			throw new Error(
				`Location ID is required for product variant ${item.productVariantId}`,
			);
		}

		// Stock validation
		const [currentStock] = await tx
			.select()
			.from(schema.productVariantStock)
			.where(
				and(
					eq(
						schema.productVariantStock.productVariantId,
						foundProductVariant.id,
					),
					eq(schema.productVariantStock.organizationId, activeOrgId),
					eq(schema.productVariantStock.locationId, item.locationId),
				),
			);

		const availableQuantity =
			Number(currentStock?.quantity || 0) -
			Number(currentStock?.reservedQuantity || 0);
		if (availableQuantity < item.quantity && !allowBackorders) {
			throw new StockError(
				productName,
				foundProductVariant.sku,
				availableQuantity,
				item.quantity,
			);
		}

		orderItemsToInsert.push({
			organizationId: activeOrgId,
			productVariantId: foundProductVariant.id,
			productName,
			sku: foundProductVariant.sku,
			quantity: Number(item.quantity || 0),
			unitPrice: unitPrice.toString(),
			totalPrice: totalPrice.toString(),
			locationId: item.locationId,
		});
	}

	return { subtotal, orderItemsToInsert };
}

async function reserveStockForOrder(
	orderItems: Array<{
		productVariantId: string;
		organizationId: string;
		quantity: number;
		locationId: string;
	}>,
	tx: TransactionDb,
) {
	for (const item of orderItems) {
		const { productVariantId, organizationId, quantity, locationId } = item;

		const currentStock = await tx.query.productVariantStock.findFirst({
			where: and(
				eq(schema.productVariantStock.productVariantId, productVariantId),
				eq(schema.productVariantStock.organizationId, organizationId),
				eq(schema.productVariantStock.locationId, locationId),
			),
			columns: {
				quantity: true,
				reservedQuantity: true,
			},
		});

		if (currentStock) {
			const newReservedQty =
				Number(currentStock.reservedQuantity || 0) + Number(quantity || 0);
			await tx
				.update(schema.productVariantStock)
				.set({ reservedQuantity: newReservedQty })
				.where(
					and(
						eq(schema.productVariantStock.productVariantId, productVariantId),
						eq(schema.productVariantStock.organizationId, organizationId),
						eq(schema.productVariantStock.locationId, locationId),
					),
				);
		} else {
			await tx.insert(schema.productVariantStock).values({
				productVariantId,
				organizationId,
				locationId,
				quantity: 0,
				reservedQuantity: Number(quantity || 0),
			});
		}
	}
}

async function addPendingBonus(
	userId: string,
	organizationId: string,
	orderId: string,
	subtotal: number,
	tx: TransactionDb,
) {
	// Award cashback points (pending status)
	await awardCashback(userId, organizationId, orderId, subtotal, "pending", tx);

	// Note: Milestone checking for first_purchase happens in cashback service
}

// Main service functions
export async function createStorefrontOrder(payload: CreateOrderInput) {
	return await db.transaction(async (tx) => {
		const { subtotal, orderItemsToInsert } = await validateOrderItems(
			payload.items,
			payload.organizationId,
			tx,
		);

		const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
		const userId = payload.userId || null;

		// Apply coupon if provided
		let discountAmount = 0;
		let couponId: string | null = null;
		let finalTotal = subtotal;

		if (payload.couponCode) {
			// Import applyCoupon function
			const { applyCoupon } = await import(
				"@/routes/admin-organization/store/rewards/coupon.service"
			);

			try {
				const couponResult = await applyCoupon(
					payload.couponCode,
					payload.organizationId,
					subtotal,
				);
				discountAmount = couponResult.discountAmount;
				couponId = couponResult.coupon.id;
				finalTotal = couponResult.finalTotal;
			} catch (error) {
				// If coupon is invalid, throw error to prevent order creation
				throw new Error(
					error instanceof Error ? error.message : "Invalid coupon code",
				);
			}
		}

		// Create order
		const [newOrder] = await tx
			.insert(schema.order)
			.values({
				userId: userId,
				organizationId: payload.organizationId,
				orderNumber,
				currency: payload.currency,
				subtotal: subtotal.toString(),
				discountAmount: discountAmount > 0 ? discountAmount.toString() : null,
				totalAmount: finalTotal.toString(),
				shippingAddress: payload.shippingAddress,
				customerEmail: payload.customerEmail || null,
				customerPhone: payload.customerPhone || null,
				customerFullName: payload.customerFullName || null,
				status: "pending",
			})
			.returning();

		// Mark coupon as used if applied
		if (couponId) {
			const { markCouponAsUsed } = await import(
				"@/routes/admin-organization/store/rewards/coupon.service"
			);
			await markCouponAsUsed(couponId, newOrder.id, tx);
		}

		// Create order items
		const createdOrderItems = await tx
			.insert(schema.orderItem)
			.values(
				orderItemsToInsert.map((it) => ({
					...it,
					orderId: newOrder.id,
					locationId: it.locationId,
				})),
			)
			.returning();

		// Reserve stock
		await reserveStockForOrder(createdOrderItems, tx);

		// Add pending bonus (only if no coupon was used)
		if (userId && !couponId) {
			await addPendingBonus(
				userId,
				payload.organizationId,
				newOrder.id,
				subtotal,
				tx,
			);
		}

		// Update client statistics for pending order
		if (userId) {
			await incrementClientUncompletedOrders(
				userId,
				payload.organizationId,
				tx,
			);
		}

		return { ...newOrder, items: createdOrderItems };
	});
}

export async function getStorefrontOrders(params: {
	organizationId: string;
	userId: string; // Mandatory for fetching list of orders
	limit?: number;
	offset?: number;
}) {
	const { organizationId, userId, limit = 20, offset = 0 } = params;

	const orders = await db
		.select()
		.from(order)
		.where(
			and(eq(order.organizationId, organizationId), eq(order.userId, userId)),
		)
		.orderBy(desc(order.createdAt))
		.limit(limit)
		.offset(offset);

	return orders;
}

export async function getStorefrontOrder(params: {
	organizationId: string;
	orderId: string;
	userId?: string;
}) {
	const { organizationId, orderId, userId } = params;

	const conditions = [
		eq(order.id, orderId),
		eq(order.organizationId, organizationId),
	];

	if (userId) {
		conditions.push(eq(order.userId, userId));
	}

	const foundOrder = await db
		.select()
		.from(order)
		.where(and(...conditions))
		.limit(1);

	if (!foundOrder.length) return null;

	const items = await db
		.select()
		.from(orderItem)
		.where(eq(orderItem.orderId, orderId));

	return {
		...foundOrder[0],
		items,
	};
}
