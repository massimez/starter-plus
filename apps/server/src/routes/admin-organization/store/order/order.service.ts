import { and, eq } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { customerPayment } from "@/lib/db/schema/financial/receivables";
import type { TOrderStatus } from "@/lib/db/schema/helpers/types";
import type { TransactionDb } from "@/types/db";
import {
	decrementClientUncompletedOrders,
	incrementClientUncompletedOrders,
	updateClientStatsOnOrderCompletion,
} from "../client/client.service";
import { createStockTransaction } from "../inventory/inventory.service";
import { checkMilestonesForEvent } from "../rewards/milestone.service";
import {
	cancelPendingPoints,
	confirmPendingPoints,
} from "../rewards/points.service";
import type { createOrderSchema } from "./schema";

type CreateOrderInput = z.infer<typeof createOrderSchema>;

/**
 * Validate stock availability and get product information for order items
 */
export async function validateOrderItems(
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
			throw new Error(
				`Product variant not found: " + ${item.productVariantId}`,
			);
		}

		// Separately fetch allowBackorders from the product table
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

		// ---- STOCK VALIDATION ----
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
			throw new Error(
				`Insufficient stock for product variant ${productName} (SKU: ${foundProductVariant.sku}). Available: ${availableQuantity}, Requested: ${item.quantity}. Backorders are not allowed.`,
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

/**
 * Reserve stock for order items
 */
export async function reserveStockForOrder(
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
			// create stock record if none exists
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

/**
 * Create a new order
 */
export async function createOrder(
	payload: CreateOrderInput,
	// biome-ignore lint/suspicious/noExplicitAny: <>
	user: any,
	activeOrgId: string,
) {
	return await db.transaction(async (tx) => {
		const { subtotal, orderItemsToInsert } = await validateOrderItems(
			payload.items,
			activeOrgId,
			tx,
		);

		const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
		const userId = user?.id || null;

		// Populate customer info from user session if not provided
		let customerEmail = payload.customerEmail || null;
		let customerPhone = payload.customerPhone || null;
		let customerFullName = payload.customerFullName || null;

		if (user && (!customerEmail || !customerPhone || !customerFullName)) {
			if (!customerEmail && user.emailVerified) customerEmail = user.email;
			if (!customerPhone && user.phoneNumberVerified)
				customerPhone = user.phoneNumber || null;
			if (!customerFullName) {
				// Construct full name from firstName + lastName, or use name as fallback
				if (user.firstName && user.lastName) {
					customerFullName = `${user.firstName} ${user.lastName}`;
				} else if (user.name) {
					customerFullName = user.name;
				}
			}
		}

		// create order
		const [newOrder] = await tx
			.insert(schema.order)
			.values({
				userId: userId,
				organizationId: activeOrgId,
				orderNumber,
				currency: payload.currency,
				subtotal: subtotal.toString(),
				totalAmount: subtotal.toString(),
				shippingAddress: payload.shippingAddress,
				customerEmail,
				customerPhone,
				customerFullName,
				status: "pending",
			})
			.returning();

		// create order items
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

		// Note: Bonus awarding is now handled by storefront order creation
		// Admin-created orders don't automatically award bonuses

		// Update client statistics for pending order
		if (userId) {
			await incrementClientUncompletedOrders(userId, activeOrgId, tx);
		}

		return { ...newOrder, items: createdOrderItems };
	});
}

/**
 * Adjust inventory for order completion by creating sale transactions
 */
export async function adjustInventoryForCompletion(
	orderId: string,
	orderItems: Array<{
		productVariantId: string;
		organizationId: string;
		quantity: number;
		locationId: string;
		unitPrice?: string;
	}>,
	activeOrgId: string,
	tx: TransactionDb,
) {
	for (const item of orderItems) {
		const { productVariantId, quantity, locationId, unitPrice } = item;

		// Get current stock to determine unit cost
		const currentStock = await tx.query.productVariantStock.findFirst({
			where: and(
				eq(schema.productVariantStock.productVariantId, productVariantId),
				eq(schema.productVariantStock.organizationId, activeOrgId),
				eq(schema.productVariantStock.locationId, locationId),
			),
		});

		// Create sale transaction with negative quantityChange
		const transactionData = {
			productVariantId,
			locationId,
			quantityChange: -quantity, // Negative for selling
			reason: "sale" as const,
			referenceId: orderId,
			// Use selling price as unitCost for tracking revenue
			unitCost: unitPrice,
			organizationId: activeOrgId,
		};

		await createStockTransaction(transactionData, activeOrgId);

		// Reduce reserved quantity since these items are now sold
		if (currentStock) {
			const newReservedQty =
				Number(currentStock.reservedQuantity || 0) - Number(quantity);
			const safeReservedQty = Math.max(0, newReservedQty);

			await tx
				.update(schema.productVariantStock)
				.set({ reservedQuantity: safeReservedQty })
				.where(
					and(
						eq(schema.productVariantStock.productVariantId, productVariantId),
						eq(schema.productVariantStock.organizationId, activeOrgId),
						eq(schema.productVariantStock.locationId, locationId),
					),
				);
		}
	}
}

/**
 * Confirm pending bonus points for order completion
 */
export async function processBonusCompletion(
	userId: string,
	organizationId: string,
	orderId: string,
	tx: TransactionDb,
) {
	// Get user's bonus account
	const account = await tx.query.userBonusAccount.findFirst({
		where: and(
			eq(schema.userBonusAccount.userId, userId),
			eq(schema.userBonusAccount.organizationId, organizationId),
		),
	});

	if (!account) {
		return; // No bonus account, skip
	}

	// Get all pending transactions for this order
	const pendingTransactions = await tx.query.bonusTransaction.findMany({
		where: and(
			eq(schema.bonusTransaction.userBonusAccountId, account.id),
			eq(schema.bonusTransaction.orderId, orderId),
			eq(schema.bonusTransaction.status, "pending"),
		),
	});

	// Confirm each pending transaction
	for (const transaction of pendingTransactions) {
		await confirmPendingPoints(transaction.id, organizationId, tx);
	}

	// Check milestones for order completion
	if (pendingTransactions.length > 0) {
		const bonusProgramId = account.bonusProgramId;
		await checkMilestonesForEvent(
			userId,
			organizationId,
			bonusProgramId,
			"order_count",
			1,
			tx,
		);
	}
}

/**
 * Create customer payment (receivable) for completed order
 * This records the order revenue in the financial receivables system
 */
async function createReceivableForOrder(
	orderId: string,
	organizationId: string,
	tx: TransactionDb,
) {
	// Get the completed order
	const order = await tx.query.order.findFirst({
		where: eq(schema.order.id, orderId),
	});

	if (!order) {
		throw new Error("Order not found");
	}

	// Only create receivable if there's a customer (userId)
	if (!order.userId) {
		console.log("Order has no userId, skipping receivable creation");
		return;
	}

	// Find the client record for this user
	const client = await tx.query.client.findFirst({
		where: and(
			eq(schema.client.userId, order.userId),
			eq(schema.client.organizationId, organizationId),
		),
	});

	if (!client) {
		console.warn(
			`No client record found for user ${order.userId}, skipping receivable creation`,
		);
		return;
	}

	// Create customer payment record (receivable)
	const paymentNumber = `PAY-${order.orderNumber}`;
	await tx.insert(customerPayment).values({
		organizationId,
		customerId: client.id, // Use client.id (UUID) instead of order.userId
		paymentNumber,
		paymentDate: new Date(),
		amount: order.totalAmount || "0",
		paymentMethod: "online", // Assuming online payment for storefront orders
		referenceNumber: order.orderNumber,
		status: "cleared",
		notes: `Payment for order ${order.orderNumber}`,
	});

	console.log(
		`Created payment ${paymentNumber} for order ${order.orderNumber}`,
	);
}

/**
 * Create order status history record
 */
export async function createOrderStatusHistory(
	orderId: string,
	organizationId: string,
	previousStatus: string | null,
	newStatus: TOrderStatus,
	tx: TransactionDb,
	notes?: string,
) {
	await tx.insert(schema.orderStatusHistory).values({
		organizationId,
		orderId,
		status: newStatus,
		previousStatus:
			newStatus !== previousStatus
				? (previousStatus as TOrderStatus | null)
				: null,
		notes,
	});
}

/**
 * Complete an order
 */
export async function completeOrder(orderId: string, activeOrgId: string) {
	const [ord] = await db.transaction(async (tx) => {
		// Get current status before updating
		const currentOrder = await tx.query.order.findFirst({
			where: and(
				eq(schema.order.id, orderId),
				eq(schema.order.organizationId, activeOrgId),
			),
			columns: { status: true },
		});

		const previousStatus = currentOrder?.status || "pending";

		const [ord] = await tx
			.update(schema.order)
			.set({ status: "completed" })
			.where(
				and(
					eq(schema.order.id, orderId),
					eq(schema.order.organizationId, activeOrgId),
				),
			)
			.returning();

		// Adjust inventory
		const orderItems = await tx.query.orderItem.findMany({
			where: eq(schema.orderItem.orderId, orderId),
		});

		await adjustInventoryForCompletion(orderId, orderItems, activeOrgId, tx);

		// Process bonus completion
		if (ord?.userId) {
			await processBonusCompletion(ord.userId, ord.organizationId, ord.id, tx);
		}

		// Update client statistics on order completion
		if (ord?.userId) {
			await updateClientStatsOnOrderCompletion(
				ord.userId,
				ord.organizationId,
				ord.totalAmount || "0",
				tx,
			);
		}

		// Create receivable for the order
		try {
			await createReceivableForOrder(orderId, activeOrgId, tx);
		} catch (error) {
			console.error("Failed to create receivable for order:", error);
			// Don't fail the order completion if receivable creation fails
		}

		// Record status change in history
		await createOrderStatusHistory(
			orderId,
			activeOrgId,
			previousStatus,
			"completed",
			tx,
		);

		return [ord];
	});

	return ord;
}

/**
 * Reverse reserved stock for order cancellation
 */
export async function reverseReservedStock(
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
				reservedQuantity: true,
			},
		});

		if (currentStock) {
			const newReservedQty =
				Number(currentStock.reservedQuantity || 0) - Number(quantity || 0);
			const safeReservedQty = Math.max(0, newReservedQty);

			await tx
				.update(schema.productVariantStock)
				.set({ reservedQuantity: safeReservedQty })
				.where(
					and(
						eq(schema.productVariantStock.productVariantId, productVariantId),
						eq(schema.productVariantStock.organizationId, organizationId),
						eq(schema.productVariantStock.locationId, locationId),
					),
				);
		}
	}
}

/**
 * Cancel pending bonus points for order cancellation
 */
export async function reversePendingBonus(
	userId: string,
	organizationId: string,
	orderId: string,
	tx: TransactionDb,
) {
	// Get user's bonus account
	const account = await tx.query.userBonusAccount.findFirst({
		where: and(
			eq(schema.userBonusAccount.userId, userId),
			eq(schema.userBonusAccount.organizationId, organizationId),
		),
	});

	if (!account) {
		return; // No bonus account, skip
	}

	// Get all pending transactions for this order
	const pendingTransactions = await tx.query.bonusTransaction.findMany({
		where: and(
			eq(schema.bonusTransaction.userBonusAccountId, account.id),
			eq(schema.bonusTransaction.orderId, orderId),
			eq(schema.bonusTransaction.status, "pending"),
		),
	});

	// Cancel each pending transaction
	for (const transaction of pendingTransactions) {
		await cancelPendingPoints(transaction.id, organizationId, tx);
	}
}

/**
 * Cancel an order
 */
export async function cancelOrder(orderId: string, activeOrgId: string) {
	const [ord] = await db.transaction(async (tx) => {
		// Get current status before updating
		const currentOrder = await tx.query.order.findFirst({
			where: and(
				eq(schema.order.id, orderId),
				eq(schema.order.organizationId, activeOrgId),
			),
			columns: { status: true },
		});

		const previousStatus = currentOrder?.status || "pending";

		const [ord] = await tx
			.update(schema.order)
			.set({ status: "cancelled" })
			.where(
				and(
					eq(schema.order.id, orderId),
					eq(schema.order.organizationId, activeOrgId),
				),
			)
			.returning();

		// Reverse reserved stock
		const orderItems = await tx.query.orderItem.findMany({
			where: eq(schema.orderItem.orderId, orderId),
		});

		await reverseReservedStock(orderItems, tx);

		// Reverse pending bonus
		if (ord?.userId) {
			await reversePendingBonus(ord.userId, ord.organizationId, ord.id, tx);
		}

		// Update client statistics on order cancellation
		if (ord?.userId) {
			await decrementClientUncompletedOrders(
				ord.userId,
				ord.organizationId,
				tx,
			);
		}

		// Record status change in history
		await createOrderStatusHistory(
			orderId,
			activeOrgId,
			previousStatus,
			"cancelled",
			tx,
		);

		return [ord];
	});

	return ord;
}
