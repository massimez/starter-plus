import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	bankAccount,
	bankTransaction,
} from "@/lib/db/schema/financial/banking";
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
		accountType: "checking" | "savings" | "credit_card";
		glAccountId: string;
		openingBalance?: number;
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
			openingBalance: (data.openingBalance || 0).toString(),
			currentBalance: (data.openingBalance || 0).toString(),
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

	// If no cash account exists, we need to create one
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

	// If no GL account exists, create a minimal one
	// Note: This is a simplified approach. In production, you'd want proper account categories
	if (!cashGlAccount) {
		// Get the first account category (or create default ones)
		const { accountCategory, accountType } = await import(
			"@/lib/db/schema/financial/accounts"
		);

		let category = await db.query.accountCategory.findFirst({
			where: eq(accountCategory.organizationId, organizationId),
		});

		// If no categories exist, create default account types and categories
		if (!category) {
			// First, ensure "asset" account type exists
			let assetType = await db.query.accountType.findFirst({
				where: eq(accountType.name, "asset"),
			});

			if (!assetType) {
				[assetType] = await db
					.insert(accountType)
					.values({
						name: "asset",
						normalBalance: "debit",
						description:
							"Assets - economic resources owned by the organization",
					})
					.returning();
			}

			// Create a "Current Assets" account category
			[category] = await db
				.insert(accountCategory)
				.values({
					organizationId,
					accountTypeId: assetType.id,
					name: "Current Assets",
					codePrefix: "1000",
					description:
						"Assets that are expected to be converted to cash within one year",
					createdBy: userId,
				})
				.returning();
		}

		[cashGlAccount] = await db
			.insert(glAccountSchema)
			.values({
				organizationId,
				accountCategoryId: category.id,
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
		currency: "USD", // Default currency, could be made configurable
		accountType: "checking",
		glAccountId: cashGlAccount.id,
		openingBalance: 0,
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
		createdBy?: string;
	},
) {
	return await db.transaction(async (tx: TransactionDb) => {
		// 1. Get current balance
		const account = await tx.query.bankAccount.findFirst({
			where: eq(bankAccount.id, data.bankAccountId),
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

		// 3. Create Transaction
		const [transaction] = await tx
			.insert(bankTransaction)
			.values({
				organizationId,
				bankAccountId: data.bankAccountId,
				transactionDate: data.transactionDate,
				valueDate: data.transactionDate,
				transactionType: data.transactionType,
				amount: data.amount.toString(),
				balanceAfter: newBalance.toString(),
				description: data.description,
				referenceNumber: data.referenceNumber,
				payeePayer: data.payeePayer,
				reconciliationStatus: "unreconciled",
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

/**
 * ---------------------------------------------------------------------------
 * RECONCILIATION OPERATIONS
 * ---------------------------------------------------------------------------
 */

export async function reconcileBankTransaction(
	organizationId: string,
	transactionId: string,
	userId: string,
) {
	return await db
		.update(bankTransaction)
		.set({
			reconciliationStatus: "reconciled",
			reconciledAt: new Date(),
			updatedBy: userId,
		})
		.where(
			and(
				eq(bankTransaction.id, transactionId),
				eq(bankTransaction.organizationId, organizationId),
			),
		)
		.returning();
}
