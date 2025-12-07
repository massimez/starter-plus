import { z } from "zod";

export const createBankAccountSchema = z.object({
	accountName: z.string().min(1),
	bankName: z.string().min(1),
	accountNumber: z.string().min(1),
	currency: z.string().length(3),
	accountType: z.enum(["checking", "savings", "credit_card"]),
	glAccountId: z.string().uuid(),
	openingBalance: z.number().default(0),
});

export const recordBankTransactionSchema = z.object({
	bankAccountId: z.string().uuid(),
	transactionDate: z.coerce.date(),
	transactionType: z.enum([
		"deposit",
		"withdrawal",
		"transfer",
		"fee",
		"interest",
	]),
	amount: z.number().positive(),
	description: z.string().optional(),
	referenceNumber: z.string().optional(),
	payeePayer: z.string().optional(),
	offsetAccountId: z.string().uuid().optional(), // Optional GL account for offsetting entry
});
