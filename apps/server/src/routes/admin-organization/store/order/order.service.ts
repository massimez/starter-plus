import { and, eq, sql } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { TransactionDb } from "@/types/db";
import type { createOrderSchema } from "./schema";

type CreateOrderInput = z.infer<typeof createOrderSchema>;

/**
 * Get organization's bonus percentage from database
 */
export async function getOrganizationBonusPercentage(
	organizationId: string,
	tx: TransactionDb,
): Promise<number> {
	const [orgInfo] = await tx
		.select({ bonusPercentage: schema.organizationInfo.bonusPercentage })
		.from(schema.organizationInfo)
		.where(eq(schema.organizationInfo.organizationId, organizationId))
		.limit(1);

	return orgInfo?.bonusPercentage ? Number(orgInfo.bonusPercentage) / 100 : 0;
}

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
			},
		});

		const allowBackorders = productInfo?.allowBackorders || false;

		const productName = productInfo?.name || "Unknown Product";
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
 * Add pending bonus for order
 */
export async function addPendingBonus(
	userId: string,
	organizationId: string,
	subtotal: number,
	tx: TransactionDb,
) {
	const bonusPercentage = await getOrganizationBonusPercentage(
		organizationId,
		tx,
	);
	const bonusEarned = subtotal * bonusPercentage;
	await tx
		.insert(schema.userBonus)
		.values({
			userId: userId,
			organizationId: organizationId,
			bonusPending: bonusEarned.toString(),
			bonus: "0",
		})
		.onConflictDoUpdate({
			target: [schema.userBonus.userId, schema.userBonus.organizationId],
			set: {
				bonusPending: sql`${schema.userBonus.bonusPending} + ${bonusEarned}`,
			},
		});
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

		// Add pending bonus
		if (userId) {
			await addPendingBonus(userId, activeOrgId, subtotal, tx);
		}

		return { ...newOrder, items: createdOrderItems };
	});
}

/**
 * Adjust inventory for order completion
 */
export async function adjustInventoryForCompletion(
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
			const newQty = Number(currentStock.quantity || 0) - Number(quantity || 0);
			const newReservedQty =
				Number(currentStock.reservedQuantity || 0) - Number(quantity || 0);
			const safeQty = Math.max(0, newQty);
			const safeReservedQty = Math.max(0, newReservedQty);

			await tx
				.update(schema.productVariantStock)
				.set({ quantity: safeQty, reservedQuantity: safeReservedQty })
				.where(
					and(
						eq(schema.productVariantStock.productVariantId, productVariantId),
						eq(schema.productVariantStock.organizationId, organizationId),
						eq(schema.productVariantStock.locationId, locationId),
					),
				);
		} else {
			// Edge case: create stock record with negative quantities
			await tx.insert(schema.productVariantStock).values({
				productVariantId,
				organizationId,
				locationId,
				quantity: -Number(quantity || 0),
				reservedQuantity: -Number(quantity || 0),
			});
		}
	}
}

/**
 * Move bonus from pending to earned
 */
export async function processBonusCompletion(
	userId: string,
	organizationId: string,
	totalAmount: string,
	tx: TransactionDb,
) {
	const bonusPercentage = await getOrganizationBonusPercentage(
		organizationId,
		tx,
	);
	const bonusEarned = Number(totalAmount || 0) * bonusPercentage;

	const currentUserBonus = await tx.query.userBonus.findFirst({
		where: and(
			eq(schema.userBonus.userId, userId),
			eq(schema.userBonus.organizationId, organizationId),
		),
		columns: { id: true, bonusPending: true, bonus: true },
	});

	if (currentUserBonus) {
		const newBonusPending =
			Number(currentUserBonus.bonusPending || 0) - bonusEarned;
		const newBonus = Number(currentUserBonus.bonus || 0) + bonusEarned;

		await tx
			.update(schema.userBonus)
			.set({
				bonusPending: newBonusPending.toString(),
				bonus: newBonus.toString(),
			})
			.where(eq(schema.userBonus.id, currentUserBonus.id));
	}
}

/**
 * Complete an order
 */
export async function completeOrder(orderId: string, activeOrgId: string) {
	const [ord] = await db.transaction(async (tx) => {
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

		await adjustInventoryForCompletion(orderItems, tx);

		// Process bonus completion
		if (ord?.userId) {
			await processBonusCompletion(
				ord.userId,
				ord.organizationId,
				ord.totalAmount || "0",
				tx,
			);
		}

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
 * Reverse pending bonus for order cancellation
 */
export async function reversePendingBonus(
	userId: string,
	organizationId: string,
	totalAmount: string,
	tx: TransactionDb,
) {
	const bonusPercentage = await getOrganizationBonusPercentage(
		organizationId,
		tx,
	);
	const bonusEarned = Number(totalAmount || 0) * bonusPercentage;

	const currentUserBonus = await tx.query.userBonus.findFirst({
		where: and(
			eq(schema.userBonus.userId, userId),
			eq(schema.userBonus.organizationId, organizationId),
		),
		columns: { id: true, bonusPending: true },
	});

	if (currentUserBonus) {
		const newBonusPending =
			Number(currentUserBonus.bonusPending || 0) - bonusEarned;

		await tx
			.update(schema.userBonus)
			.set({ bonusPending: newBonusPending.toString() })
			.where(eq(schema.userBonus.id, currentUserBonus.id));
	}
}

/**
 * Cancel an order
 */
export async function cancelOrder(orderId: string, activeOrgId: string) {
	const [ord] = await db.transaction(async (tx) => {
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
			await reversePendingBonus(
				ord.userId,
				ord.organizationId,
				ord.totalAmount || "0",
				tx,
			);
		}

		return [ord];
	});

	return ord;
}
