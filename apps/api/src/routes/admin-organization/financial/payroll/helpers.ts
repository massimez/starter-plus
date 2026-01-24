import { and, eq, sql } from "drizzle-orm";
import { payrollEntry, payrollRun } from "@/lib/db/schema";
import type { TransactionDb } from "@/types/db";

export function calculateTotals(
	baseSalary: number,
	// biome-ignore lint/suspicious/noExplicitAny: <>
	components: any,
	adjustments: Array<{ type: string; amount: number }>,
) {
	let grossSalary = baseSalary;
	let totalDeductions = 0;

	// Add components
	if (Array.isArray(components)) {
		for (const comp of components) {
			const amount = Number(comp.amount);
			if (comp.type === "earning") grossSalary += amount;
			else if (comp.type === "deduction") totalDeductions += amount;
		}
	}

	// Add adjustments
	for (const adj of adjustments) {
		const amount = Number(adj.amount);
		if (adj.type === "earning") grossSalary += amount;
		else if (adj.type === "deduction") totalDeductions += amount;
	}

	return { grossSalary, totalDeductions };
}

export async function updatePayrollRunTotals(
	tx: TransactionDb,
	runId: string,
	organizationId: string,
) {
	const totals = await tx
		.select({
			totalGross: sql<string>`sum(${payrollEntry.grossSalary})`,
			totalDeductions: sql<string>`sum(${payrollEntry.totalDeductions})`,
			totalNet: sql<string>`sum(${payrollEntry.netSalary})`,
		})
		.from(payrollEntry)
		.where(eq(payrollEntry.payrollRunId, runId));

	const { totalGross, totalDeductions, totalNet } = totals[0];

	await tx
		.update(payrollRun)
		.set({
			totalGross: totalGross || "0",
			totalDeductions: totalDeductions || "0",
			totalNet: totalNet || "0",
		})
		.where(
			and(
				eq(payrollRun.id, runId),
				eq(payrollRun.organizationId, organizationId),
			),
		);
}
