import { z } from "zod";

// Invoice schema
export const createInvoiceSchema = z.object({
	invoiceType: z.enum(["receivable", "payable"]),
	customerId: z.string().uuid().optional(),
	supplierId: z.string().uuid().optional(),
	invoiceNumber: z.string().min(1),
	invoiceDate: z.coerce.date(),
	dueDate: z.coerce.date(),
	currency: z.string().length(3),
	items: z
		.array(
			z.object({
				accountId: z.string().uuid(),
				description: z.string().min(1),
				quantity: z.number().positive(),
				unitPrice: z.number(),
				taxRate: z.number().min(0).max(100).optional(),
			}),
		)
		.min(1),
});

export const updateInvoiceSchema = createInvoiceSchema;

// Payment schema
export const recordPaymentSchema = z.object({
	paymentType: z.enum(["received", "sent"]),
	customerId: z.string().uuid().optional(),
	supplierId: z.string().uuid().optional(),
	amount: z.number().positive(),
	paymentDate: z.coerce.date(),
	paymentMethod: z.enum(["bank_transfer", "check", "cash", "card", "online"]),
	referenceNumber: z.string().optional(),
	bankAccountId: z.string().uuid().optional(),
	allocations: z
		.array(
			z.object({
				invoiceId: z.string().uuid(),
				amount: z.number().positive(),
			}),
		)
		.min(1),
});
