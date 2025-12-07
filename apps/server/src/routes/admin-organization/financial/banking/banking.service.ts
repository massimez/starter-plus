import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { glAccount } from "@/lib/db/schema/financial/accounts";
import {
	bankAccount,
	bankTransaction,
} from "@/lib/db/schema/financial/banking";
import {
	journalEntry,
	journalEntryLine,
} from "@/lib/db/schema/financial/journal";
import type { TransactionDb } from "@/types/db";

/**
 * ---------------------------------------------------------------------------
 * BANK ACCOUNT OPERATIONS
 * ---------------------------------------------------------------------------
 */

export async function createBankAccount(
	organizationId: string,
	data: {
		accountName: string;
		bankName: string;
		accountNumber: string;
		currency: string;
		accountType: "checking" | "savings" | "credit";
		glAccountId: string;
		createdBy?: string;
	},
) {
	const [account] = await db
		.insert(bankAccount)
		.values({
			organizationId,
			accountName: data.accountName,
			bankName: data.bankName,
			accountNumber: data.accountNumber,
			currency: data.currency,
			accountType: data.accountType,
			glAccountId: data.glAccountId,
			currentBalance: "0",
			isActive: true,
			createdBy: data.createdBy,
		})
		.returning();

	return account;
}

export async function getBankAccounts(organizationId: string) {
	return await db.query.bankAccount.findMany({
		where: eq(bankAccount.organizationId, organizationId),
		with: {
			glAccount: true,
		},
	});
}

/**
 * Get or create a default Cash account for the organization
 * This simplifies cash transaction handling by ensuring a cash account always exists
 */
export async function getOrCreateDefaultCashAccount(
	organizationId: string,
	userId?: string,
) {
	// First, try to find an existing cash account
	const accounts = await getBankAccounts(organizationId);
	const cashAccount = accounts.find(
		(acc) =>
			acc.accountName?.toLowerCase().includes("cash") ||
			acc.bankName?.toLowerCase().includes("cash"),
	);

	if (cashAccount) {
		return cashAccount;
	}

	// If no cash account exists, create one
	// First, get or create a GL account for cash
	const { glAccount: glAccountSchema } = await import(
		"@/lib/db/schema/financial/accounts"
	);

	// Try to find an existing Cash GL account
	let cashGlAccount = await db.query.glAccount.findFirst({
		where: and(
			eq(glAccountSchema.organizationId, organizationId),
			eq(glAccountSchema.name, "Cash"),
		),
	});

	// If no GL account exists, create one
	if (!cashGlAccount) {
		[cashGlAccount] = await db
			.insert(glAccountSchema)
			.values({
				organizationId,
				accountType: "asset",
				category: "Current Assets",
				normalBalance: "debit",
				code: "1000",
				name: "Cash",
				description: "Cash on hand",
				isActive: true,
				allowManualEntries: true,
				createdBy: userId,
			})
			.returning();
	}

	// Now create the cash bank account
	return await createBankAccount(organizationId, {
		accountName: "Cash",
		bankName: "Cash",
		accountNumber: "CASH-001",
		currency: "USD",
		accountType: "checking",
		glAccountId: cashGlAccount.id,
		createdBy: userId,
	});
}

/**
 * ---------------------------------------------------------------------------
 * TRANSACTION OPERATIONS
 * ---------------------------------------------------------------------------
 */

export async function recordBankTransaction(
	organizationId: string,
	data: {
		bankAccountId: string;
		transactionDate: Date;
		transactionType: "deposit" | "withdrawal" | "transfer" | "fee" | "interest";
		amount: number;
		description?: string;
		referenceNumber?: string;
		payeePayer?: string;
		offsetAccountId?: string; // Optional GL account for the offsetting entry
		createdBy?: string;
	},
) {
	return await db.transaction(async (tx: TransactionDb) => {
		// 1. Get current balance and bank account details
		const account = await tx.query.bankAccount.findFirst({
			where: eq(bankAccount.id, data.bankAccountId),
			with: { glAccount: true },
		});

		if (!account) throw new Error("Bank account not found");

		// 2. Calculate new balance
		let impact = 0;
		if (["deposit", "interest"].includes(data.transactionType)) {
			impact = data.amount;
		} else {
			impact = -data.amount;
		}

		const newBalance = Number(account.currentBalance) + impact;

		// 3. Create Bank Transaction Record
		const [transaction] = await tx
			.insert(bankTransaction)
			.values({
				organizationId,
				bankAccountId: data.bankAccountId,
				transactionDate: data.transactionDate,
				transactionType: data.transactionType,
				amount: data.amount.toString(),
				balanceAfter: newBalance.toString(),
				description: data.description,
				referenceNumber: data.referenceNumber,
				payeePayer: data.payeePayer,
				createdBy: data.createdBy,
			})
			.returning();

		// 4. Update Account Balance
		await tx
			.update(bankAccount)
			.set({
				currentBalance: newBalance.toString(),
			})
			.where(eq(bankAccount.id, data.bankAccountId));

		// 5. Create Journal Entry for Double-Entry Bookkeeping

		// Get or create default offsetting accounts
		let offsetAccountId = data.offsetAccountId;

		if (!offsetAccountId) {
			// Create default "Miscellaneous Income" or "Miscellaneous Expense" account
			const isIncome = ["deposit", "interest"].includes(data.transactionType);
			const defaultAccountName = isIncome
				? "Miscellaneous Income"
				: "Miscellaneous Expense";
			const defaultAccountCode = isIncome ? "4900" : "5900";

			// Use independent select instead of tx.query to avoid schema registration issues
			let [defaultAccount] = await tx
				.select()
				.from(glAccount)
				.where(
					and(
						eq(glAccount.organizationId, organizationId),
						eq(glAccount.code, defaultAccountCode),
					),
				)
				.limit(1);

			if (!defaultAccount) {
				[defaultAccount] = await tx
					.insert(glAccount)
					.values({
						organizationId,
						code: defaultAccountCode,
						name: defaultAccountName,
						accountType: isIncome ? "revenue" : "expense",
						category: isIncome ? "Other Income" : "Other Expenses",
						normalBalance: isIncome ? "credit" : "debit",
						description: `Auto-created for manual ${isIncome ? "deposits" : "withdrawals"}`,
						isActive: true,
						allowManualEntries: true,
						createdBy: data.createdBy,
					})
					.returning();
			}

			if (!defaultAccount) {
				throw new Error("Failed to create default offsetting account");
			}

			offsetAccountId = defaultAccount.id;
		}

		// Create the journal entry
		const [entry] = await tx
			.insert(journalEntry)
			.values({
				organizationId,
				entryNumber: `JE-${Date.now()}`,
				entryType: "manual",
				entryDate: data.transactionDate,
				description:
					data.description ||
					`Bank ${data.transactionType} - ${account.accountName}`,
				// referenceNumber: data.referenceNumber, // Removed as it does not exist in schema
				status: "posted", // Auto-post manual bank transactions
				createdBy: data.createdBy,
			})
			.returning();

		// Create journal entry lines based on transaction type
		const isDebit = ["deposit", "interest"].includes(data.transactionType);

		// Line 1: Bank account side
		await tx.insert(journalEntryLine).values({
			journalEntryId: entry.id,
			accountId: account.glAccountId,
			debitAmount: isDebit ? data.amount.toString() : "0",
			creditAmount: isDebit ? "0" : data.amount.toString(),
			description: data.description || `${data.transactionType}`,
			lineNumber: 1,
		});

		// Line 2: Offsetting account side
		await tx.insert(journalEntryLine).values({
			journalEntryId: entry.id,
			accountId: offsetAccountId,
			debitAmount: isDebit ? "0" : data.amount.toString(),
			creditAmount: isDebit ? data.amount.toString() : "0",
			description: data.description || `${data.transactionType}`,
			lineNumber: 2,
		});

		return transaction;
	});
}

export async function getBankTransactions(
	organizationId: string,
	bankAccountId: string,
	limit = 50,
) {
	return await db.query.bankTransaction.findMany({
		where: and(
			eq(bankTransaction.organizationId, organizationId),
			eq(bankTransaction.bankAccountId, bankAccountId),
		),
		orderBy: [desc(bankTransaction.transactionDate)],
		limit,
	});
}

export async function getAllBankTransactions(
	organizationId: string,
	limit = 50,
) {
	return await db.query.bankTransaction.findMany({
		where: eq(bankTransaction.organizationId, organizationId),
		orderBy: [desc(bankTransaction.transactionDate)],
		with: {
			bankAccount: true,
		},
		limit,
	});
}
