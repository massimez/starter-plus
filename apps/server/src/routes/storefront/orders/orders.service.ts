import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { order, orderItem } from "@/lib/db/schema/store/order";
import type { TransactionDb } from "@/types/db";

// Types
type CreateOrderInput = {
	organizationId: string;
	shippingAddress: {
		street: string;
		city: string;
		state: string;
		country: string;
		postalCode: string;
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
};

// Helper functions
async function getOrganizationBonusPercentage(
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
			throw new Error(
				`Product variant not found: " + ${item.productVariantId}`,
			);
		}

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

		// Create order
		const [newOrder] = await tx
			.insert(schema.order)
			.values({
				userId: userId,
				organizationId: payload.organizationId,
				orderNumber,
				currency: payload.currency,
				subtotal: subtotal.toString(),
				totalAmount: subtotal.toString(),
				shippingAddress: payload.shippingAddress,
				customerEmail: payload.customerEmail || null,
				customerPhone: payload.customerPhone || null,
				customerFullName: payload.customerFullName || null,
				status: "pending",
			})
			.returning();

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

		// Add pending bonus
		if (userId) {
			await addPendingBonus(userId, payload.organizationId, subtotal, tx);
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
