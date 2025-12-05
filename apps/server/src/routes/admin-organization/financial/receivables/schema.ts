import { z } from "zod";

export const createCustomerInvoiceSchema = z.object({
	customerId: z.string().uuid(),
	invoiceNumber: z.string().min(1),
	invoiceDate: z.coerce.date(),
	dueDate: z.coerce.date(),
	currency: z.string().length(3),
	items: z
		.array(
			z.object({
				revenueAccountId: z.string().uuid(),
				description: z.string().min(1),
				quantity: z.number().positive(),
				unitPrice: z.number().nonnegative(),
				taxRate: z.number().min(0).max(100).optional(),
			}),
		)
		.min(1),
});

export const recordCustomerPaymentSchema = z.object({
	customerId: z.string().uuid(),
	amount: z.number().positive(),
	paymentDate: z.coerce.date(),
	paymentMethod: z.enum(["bank_transfer", "check", "cash", "card", "online"]),
	referenceNumber: z.string().optional(),
	bankAccountId: z.string().uuid().optional(),
	allocations: z.array(
		z.object({
			invoiceId: z.string().uuid(),
			amount: z.number().positive(),
		}),
	),
});
