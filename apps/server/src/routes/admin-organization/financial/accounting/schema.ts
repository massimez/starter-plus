import { z } from "zod";

export const createAccountSchema = z.object({
	code: z.string().min(1),
	name: z.string().min(1),
	accountCategoryId: z.string().uuid(),
	description: z.string().optional(),
	parentAccountId: z.string().uuid().optional(),
	allowManualEntries: z.boolean().default(true),
});

export const updateAccountSchema = createAccountSchema.partial();

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
