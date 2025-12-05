import { z } from "zod";

export const createSupplierInvoiceSchema = z.object({
	supplierId: z.string().uuid(),
	invoiceNumber: z.string().min(1),
	invoiceDate: z.coerce.date(),
	dueDate: z.coerce.date(),
	currency: z.string().length(3),
	items: z
		.array(
			z.object({
				expenseAccountId: z.string().uuid(),
				description: z.string().min(1),
				quantity: z.number().positive(),
				unitPrice: z.number().nonnegative(),
				taxRate: z.number().min(0).max(100).optional(),
			}),
		)
		.min(1),
});

export const recordSupplierPaymentSchema = z.object({
	supplierId: z.string().uuid(),
	amount: z.number().positive(),
	paymentDate: z.coerce.date(),
	paymentMethod: z.enum(["bank_transfer", "check", "cash", "card"]),
	referenceNumber: z.string().optional(),
	bankAccountId: z.string().uuid().optional(),
	allocations: z.array(
		z.object({
			invoiceId: z.string().uuid(),
			amount: z.number().positive(),
		}),
	),
});
