import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { glAccount } from "@/lib/db/schema/financial/accounts";
import {
	journalEntry,
	journalEntryLine,
} from "@/lib/db/schema/financial/journal";
import { getAuditData } from "@/lib/utils/audit";
import type { TransactionDb } from "@/types/db";

/**
 * ---------------------------------------------------------------------------
 * CHART OF ACCOUNTS (COA) OPERATIONS
 * ---------------------------------------------------------------------------
 */

export async function getChartOfAccounts(organizationId: string) {
	const accounts = await db.query.glAccount.findMany({
		where: eq(glAccount.organizationId, organizationId),
		orderBy: [desc(glAccount.code)],
	});

	return accounts;
}

export async function createAccount(
	organizationId: string,
	data: {
		code: string;
		name: string;
		accountType: "asset" | "liability" | "equity" | "revenue" | "expense";
		category?: string;
		normalBalance: "debit" | "credit";
		description?: string;
		allowManualEntries?: boolean;
	},
	user: { id: string },
) {
	const [newAccount] = await db
		.insert(glAccount)
		.values({
			organizationId,
			code: data.code,
			name: data.name,
			accountType: data.accountType,
			category: data.category,
			normalBalance: data.normalBalance,
			description: data.description,
			allowManualEntries: data.allowManualEntries,
			...getAuditData(user, "create"),
		})
		.returning();

	return newAccount;
}

export async function updateAccount(
	organizationId: string,
	accountId: string,
	data: Partial<typeof glAccount.$inferInsert>,
	user: { id: string },
) {
	const [updatedAccount] = await db
		.update(glAccount)
		.set({
			...data,
			...getAuditData(user, "update"),
		})
		.where(
			and(
				eq(glAccount.id, accountId),
				eq(glAccount.organizationId, organizationId),
			),
		)
		.returning();

	return updatedAccount;
}

/**
 * ---------------------------------------------------------------------------
 * JOURNAL ENTRY OPERATIONS
 * ---------------------------------------------------------------------------
 */

export async function createJournalEntry(
	organizationId: string,
	data: {
		entryDate: Date;
		description: string;
		referenceType?: string;
		referenceId?: string;
		lines: {
			accountId: string;
			debitAmount: string;
			creditAmount: string;
			description?: string;
		}[];
		createdBy?: string;
	},
) {
	// 1. Validate double-entry balance (Debits must equal Credits)
	const totalDebit = data.lines.reduce(
		(sum, line) => sum + Number(line.debitAmount),
		0,
	);
	const totalCredit = data.lines.reduce(
		(sum, line) => sum + Number(line.creditAmount),
		0,
	);

	if (Math.abs(totalDebit - totalCredit) > 0.0001) {
		throw new Error(
			`Journal entry is not balanced. Debits: ${totalDebit}, Credits: ${totalCredit}`,
		);
	}

	// 2. Generate entry number
	const entryNumber = `JE-${Date.now()}`;

	return await db.transaction(async (tx: TransactionDb) => {
		// 3. Create Header
		const [entry] = await tx
			.insert(journalEntry)
			.values({
				organizationId,
				entryNumber,
				entryDate: data.entryDate,
				description: data.description,
				entryType: "manual",
				referenceType: data.referenceType,
				referenceId: data.referenceId,
				status: "draft",
				createdBy: data.createdBy,
			})
			.returning();

		// 4. Create Lines
		if (data.lines.length > 0) {
			await tx.insert(journalEntryLine).values(
				data.lines.map((line, index) => ({
					journalEntryId: entry.id,
					accountId: line.accountId,
					debitAmount: line.debitAmount,
					creditAmount: line.creditAmount,
					description: line.description || data.description,
					lineNumber: index + 1,
					createdBy: data.createdBy,
				})),
			);
		}

		return entry;
	});
}

export async function postJournalEntry(
	organizationId: string,
	entryId: string,
	userId: string,
) {
	const [entry] = await db
		.update(journalEntry)
		.set({
			status: "posted",
			postingDate: new Date(),
			approvedBy: userId,
			approvedAt: new Date(),
		})
		.where(
			and(
				eq(journalEntry.id, entryId),
				eq(journalEntry.organizationId, organizationId),
				eq(journalEntry.status, "draft"),
			),
		)
		.returning();

	if (!entry) {
		throw new Error("Journal entry not found or already posted");
	}

	return entry;
}

export async function getJournalEntries(organizationId: string) {
	return await db.query.journalEntry.findMany({
		where: eq(journalEntry.organizationId, organizationId),
		with: {
			lines: {
				with: {
					account: true,
				},
			},
		},
		orderBy: [desc(journalEntry.entryDate)],
	});
}

/**
 * Delete a draft journal entry and its lines
 * Only draft entries can be deleted
 */
export async function deleteJournalEntry(
	organizationId: string,
	entryId: string,
) {
	// First verify the entry exists and is in draft status
	const entry = await db.query.journalEntry.findFirst({
		where: and(
			eq(journalEntry.id, entryId),
			eq(journalEntry.organizationId, organizationId),
		),
	});

	if (!entry) {
		throw new Error("Journal entry not found");
	}

	if (entry.status !== "draft") {
		throw new Error("Only draft journal entries can be deleted");
	}

	// Delete in transaction - lines first, then header
	return await db.transaction(async (tx: TransactionDb) => {
		// Delete lines
		await tx
			.delete(journalEntryLine)
			.where(eq(journalEntryLine.journalEntryId, entryId));

		// Delete header
		const [deleted] = await tx
			.delete(journalEntry)
			.where(eq(journalEntry.id, entryId))
			.returning();

		return deleted;
	});
}

/**
 * ---------------------------------------------------------------------------
 * REPORTING OPERATIONS
 * ---------------------------------------------------------------------------
 */

export async function getTrialBalance(organizationId: string, asOfDate: Date) {
	const balances = await db
		.select({
			accountId: journalEntryLine.accountId,
			accountName: glAccount.name,
			accountCode: glAccount.code,
			totalDebit: sql<string>`sum(${journalEntryLine.debitAmount})`,
			totalCredit: sql<string>`sum(${journalEntryLine.creditAmount})`,
		})
		.from(journalEntryLine)
		.innerJoin(
			journalEntry,
			eq(journalEntryLine.journalEntryId, journalEntry.id),
		)
		.innerJoin(glAccount, eq(journalEntryLine.accountId, glAccount.id))
		.where(
			and(
				eq(journalEntry.organizationId, organizationId),
				eq(journalEntry.status, "posted"),
				sql`${journalEntry.entryDate} <= ${asOfDate.toISOString()}`,
			),
		)
		.groupBy(journalEntryLine.accountId, glAccount.name, glAccount.code);

	return balances.map((b) => ({
		...b,
		netBalance: Number(b.totalDebit) - Number(b.totalCredit),
	}));
}
