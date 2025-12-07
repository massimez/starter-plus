/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bankTransaction } from "@/lib/db/schema/financial/banking";
import { expense } from "@/lib/db/schema/financial/expenses";
import { payment } from "@/lib/db/schema/financial/invoices";
import { payoutRequest } from "@/lib/db/schema/financial/payout";
import { payrollRun } from "@/lib/db/schema/financial/payroll";

// Types
type TransactionType =
	| "bank"
	| "receivable"
	| "payable"
	| "expense"
	| "payroll"
	| "payout";
type TransactionDirection = "deposit" | "withdrawal";

interface NormalizedTransaction {
	id: string;
	transactionDate: Date;
	type: TransactionType;
	transactionType: TransactionDirection;
	description: string;
	amount: string;
	reconciliationStatus: string;
	referenceNumber: string;
	payeePayer: string;
	bankAccount: any | null;
}

interface FetchConfig<T> {
	name: string;
	fetcher: () => Promise<T[]>;
	normalizer: (data: T[]) => NormalizedTransaction[];
}

// Normalizer functions
const normalizeBankTransactions = (
	transactions: any[],
): NormalizedTransaction[] =>
	transactions.map((t) => ({
		id: t.id,
		transactionDate: t.transactionDate,
		type: "bank" as const,
		transactionType: t.transactionType,
		description: t.description || "",
		amount: t.amount,
		reconciliationStatus: "unreconciled", // Bank transactions don't track reconciliation yet
		referenceNumber: t.referenceNumber || "",
		payeePayer: t.payeePayer || "",
		bankAccount: t.bankAccount,
	}));

const normalizePayments = (payments: any[]): NormalizedTransaction[] =>
	payments.map((p) => ({
		id: p.id,
		transactionDate: p.paymentDate,
		type:
			p.paymentType === "received"
				? ("receivable" as const)
				: ("payable" as const),
		transactionType:
			p.paymentType === "received"
				? ("deposit" as const)
				: ("withdrawal" as const),
		description:
			p.notes ||
			`${p.paymentType === "received" ? "Payment" : "Bill Payment"} ${p.paymentNumber}`,
		amount: p.amount,
		reconciliationStatus: p.status,
		referenceNumber: p.referenceNumber || p.paymentNumber,
		payeePayer:
			p.customer?.name ||
			p.supplier?.name ||
			`${p.partyType} ${p.customerId || p.supplierId || ""}`,
		bankAccount: null,
	}));

const normalizeExpenses = (expenses: any[]): NormalizedTransaction[] =>
	expenses.map((e) => ({
		id: e.id,
		transactionDate: e.expenseDate,
		type: "expense" as const,
		transactionType: "withdrawal" as const,
		description: e.description || "Expense",
		amount: e.amount,
		reconciliationStatus: e.status,
		referenceNumber: "",
		payeePayer: e.user
			? `${e.user.firstName || ""} ${e.user.lastName || ""}`.trim() ||
				e.user.email ||
				"User"
			: "User",
		bankAccount: null,
	}));

const normalizePayrollEntries = (runs: any[]): NormalizedTransaction[] => {
	const entries = runs.flatMap((run) =>
		run.entries.map((entry: any) => ({
			...entry,
			transactionDate: run.paymentDate,
		})),
	);

	return entries.map((p) => ({
		id: p.id,
		transactionDate: p.transactionDate,
		type: "payroll" as const,
		transactionType: "withdrawal" as const,
		description:
			`Payroll - ${p.employee?.firstName || ""} ${p.employee?.lastName || ""}`.trim(),
		amount: p.netSalary,
		reconciliationStatus: p.status,
		referenceNumber: "",
		payeePayer:
			`${p.employee?.firstName || ""} ${p.employee?.lastName || ""}`.trim() ||
			"Employee",
		bankAccount: null,
	}));
};

const normalizePayoutRequests = (requests: any[]): NormalizedTransaction[] =>
	requests.map((p) => ({
		id: p.id,
		transactionDate: p.createdAt,
		type: "payout" as const,
		transactionType: "withdrawal" as const,
		description: `Payout Request - ${typeof p.payoutMethod === "object" ? (p.payoutMethod as any)?.type : "N/A"}`,
		amount: p.cashAmount,
		reconciliationStatus: p.status,
		referenceNumber: "",
		payeePayer: p.userId || "User",
		bankAccount: null,
	}));

// Generic fetch with error handling
async function safeFetch<T>(
	name: string,
	fetcher: () => Promise<T[]>,
): Promise<T[]> {
	try {
		return await fetcher();
	} catch (error) {
		console.warn(`Failed to fetch ${name}:`, error);
		return [];
	}
}

/**
 * Get all financial transactions across all modules
 * Combines bank, receivables, payables, expenses, payroll, and payouts
 */
export async function getAllFinancialTransactions(
	organizationId: string,
	limit = 100,
): Promise<NormalizedTransaction[]> {
	// Define all fetch configurations
	const fetchConfigs: FetchConfig<any>[] = [
		{
			name: "bank transactions",
			fetcher: () =>
				db.query.bankTransaction.findMany({
					where: eq(bankTransaction.organizationId, organizationId),
					orderBy: [desc(bankTransaction.transactionDate)],
					with: { bankAccount: true },
					limit,
				}),
			normalizer: normalizeBankTransactions,
		},
		{
			name: "payments",
			fetcher: () =>
				db.query.payment.findMany({
					where: eq(payment.organizationId, organizationId),
					orderBy: [desc(payment.paymentDate)],
					with: { customer: true, supplier: true },
					limit,
				}),
			normalizer: normalizePayments,
		},
		{
			name: "expenses",
			fetcher: () =>
				db.query.expense.findMany({
					where: eq(expense.organizationId, organizationId),
					orderBy: [desc(expense.expenseDate)],
					with: { user: true },
					limit,
				}),
			normalizer: normalizeExpenses,
		},
		{
			name: "payroll runs",
			fetcher: () =>
				db.query.payrollRun.findMany({
					where: eq(payrollRun.organizationId, organizationId),
					orderBy: [desc(payrollRun.paymentDate)],
					with: {
						entries: {
							with: { employee: true },
						},
					},
					limit,
				}),
			normalizer: normalizePayrollEntries,
		},
		{
			name: "payout requests",
			fetcher: () =>
				db
					.select()
					.from(payoutRequest)
					.where(eq(payoutRequest.organizationId, organizationId))
					.orderBy(desc(payoutRequest.createdAt))
					.limit(limit),
			normalizer: normalizePayoutRequests,
		},
	];

	// Fetch all data in parallel
	const results = await Promise.all(
		fetchConfigs.map(async (config) => {
			const data = await safeFetch(config.name, config.fetcher);
			return config.normalizer(data);
		}),
	);

	// Flatten and sort all transactions
	const allTransactions = results.flat();

	allTransactions.sort(
		(a, b) =>
			new Date(b.transactionDate).getTime() -
			new Date(a.transactionDate).getTime(),
	);

	return allTransactions.slice(0, limit);
}

// Optional: Export individual fetchers for more granular use
export async function getBankTransactions(
	organizationId: string,
	limit = 100,
): Promise<NormalizedTransaction[]> {
	const data = await safeFetch("bank transactions", () =>
		db.query.bankTransaction.findMany({
			where: eq(bankTransaction.organizationId, organizationId),
			orderBy: [desc(bankTransaction.transactionDate)],
			with: { bankAccount: true },
			limit,
		}),
	);
	return normalizeBankTransactions(data);
}

export async function getPayments(
	organizationId: string,
	limit = 100,
): Promise<NormalizedTransaction[]> {
	const data = await safeFetch("payments", () =>
		db.query.payment.findMany({
			where: eq(payment.organizationId, organizationId),
			orderBy: [desc(payment.paymentDate)],
			with: { customer: true, supplier: true },
			limit,
		}),
	);
	return normalizePayments(data);
}
