import { z } from "zod";

export const shippingAddressSchema = z.object({
	street: z.string().min(1),
	city: z.string().min(1),
	state: z.string().min(1),
	country: z.string().min(1),
	postalCode: z.string().min(1),
});

export const orderItemSchema = z.object({
	productVariantId: z.uuid(),
	quantity: z.number().int().positive(),
	locationId: z.uuid(),
});

export const createOrderSchema = z.object({
	shippingAddress: shippingAddressSchema,
	items: z.array(orderItemSchema).min(1),
	currency: z.string().length(3),
	customerEmail: z.email().optional(),
	customerPhone: z.string().optional(),
	customerFullName: z.string().optional(),
	locationId: z.uuid(),
});

export const updateOrderSchema = z.object({
	status: z
		.enum([
			"draft",
			"pending",
			"confirmed",
			"processing",
			"shipped",
			"delivered",
			"completed",
			"cancelled",
			"failed",
			"returned",
			"paid",
			"refunded",
		])
		.optional(),
	customerEmail: z.email().optional(),
	customerPhone: z.string().optional(),
	customerNotes: z.string().optional(),
	customerFullName: z.string().optional(),
	shippingAddress: shippingAddressSchema.optional(),
	shippingMethod: z.string().optional(),
	trackingNumber: z.string().optional(),
	expectedShipDate: z.coerce.date().optional(),
	notes: z.string().optional(),
	tags: z.array(z.string()).optional(),
});
