import { z } from "zod";

export const createAccountSchema = z.object({
	code: z.string().min(1),
	name: z.string().min(1),
	accountType: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
	category: z.string().optional(),
	normalBalance: z.enum(["debit", "credit"]),
	description: z.string().optional(),
	allowManualEntries: z.boolean().default(true),
});

export const updateAccountSchema = z.object({
	name: z.string().min(1).optional(),
	description: z.string().optional(),
	isActive: z.boolean().optional(),
});

export const createJournalEntrySchema = z.object({
	entryDate: z.coerce.date(),
	description: z.string().min(1),
	referenceType: z.string().optional(),
	referenceId: z.string().uuid().optional(),
	lines: z
		.array(
			z.object({
				accountId: z.string().uuid(),
				debitAmount: z.string().regex(/^\d+(\.\d{1,4})?$/, "Invalid amount"),
				creditAmount: z.string().regex(/^\d+(\.\d{1,4})?$/, "Invalid amount"),
				description: z.string().optional(),
			}),
		)
		.min(2, "Journal entry must have at least 2 lines"),
});
