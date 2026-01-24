import { and, desc, eq, gte, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	employee,
	payrollEntry,
	payrollRun,
	salaryAdvance,
	salaryComponent,
} from "@/lib/db/schema/financial/payroll";
import type { TransactionDb } from "@/types/db";
import { calculateTotals, updatePayrollRunTotals } from "./helpers";

/**
 * ---------------------------------------------------------------------------
 * EMPLOYEE & SALARY OPERATIONS
 * ---------------------------------------------------------------------------
 */

export async function createEmployee(
	organizationId: string,
	data: typeof employee.$inferInsert,
) {
	const [newEmployee] = await db
		.insert(employee)
		.values({
			...data,
			organizationId,
		})
		.returning();

	return newEmployee;
}

export async function updateEmployee(
	organizationId: string,
	employeeId: string,
	data: {
		firstName?: string;
		lastName?: string;
		email?: string;
		phone?: string;
		position?: string;
		employmentType?: "full_time" | "part_time" | "contract";
		bankAccountNumber?: string;
		taxId?: string;
		status?: "active" | "on_leave" | "terminated";
		baseSalary?: string;
		currency?: string;
		paymentFrequency?: "monthly" | "bi_weekly" | "weekly";
		salaryComponents?: Array<{
			componentId: string;
			amount: number;
			type: "earning" | "deduction";
		}>;
		terminationDate?: string | Date | null;
	},
) {
	// biome-ignore lint/suspicious/noExplicitAny: <>
	const updateData: any = { ...data };

	if (data.baseSalary !== undefined) {
		updateData.baseSalary = data.baseSalary.toString();
	}

	if (data.terminationDate) {
		updateData.terminationDate = new Date(data.terminationDate);
	} else if (data.terminationDate === null) {
		updateData.terminationDate = null;
	}

	const [updated] = await db
		.update(employee)
		.set(updateData)
		.where(
			and(
				eq(employee.id, employeeId),
				eq(employee.organizationId, organizationId),
			),
		)
		.returning();

	if (!updated) {
		throw new Error("Employee not found");
	}

	return updated;
}

export async function getEmployees(organizationId: string) {
	return await db.query.employee.findMany({
		where: eq(employee.organizationId, organizationId),
	});
}

/**
 * ---------------------------------------------------------------------------
 * PAYROLL RUN OPERATIONS
 * ---------------------------------------------------------------------------
 */

export async function createPayrollRun(
	organizationId: string,
	data: {
		periodStart: Date;
		periodEnd: Date;
		paymentDate: Date;
		createdBy?: string;
	},
) {
	const [run] = await db
		.insert(payrollRun)
		.values({
			organizationId,
			payrollPeriodStart: data.periodStart,
			payrollPeriodEnd: data.periodEnd,
			paymentDate: data.paymentDate,
			status: "draft",
			createdBy: data.createdBy,
		})
		.returning();

	return run;
}

export async function deletePayrollRun(organizationId: string, runId: string) {
	const [run] = await db
		.delete(payrollRun)
		.where(
			and(
				eq(payrollRun.id, runId),
				eq(payrollRun.organizationId, organizationId),
				eq(payrollRun.status, "draft"),
			),
		)
		.returning();

	if (!run) {
		throw new Error(
			"Payroll run not found or cannot be deleted (must be draft or calculated)",
		);
	}

	return run;
}

export async function calculatePayroll(organizationId: string, runId: string) {
	// 1. Get run details to know the period
	const run = await db.query.payrollRun.findFirst({
		where: and(
			eq(payrollRun.id, runId),
			eq(payrollRun.organizationId, organizationId),
		),
	});

	if (!run) throw new Error("Payroll run not found");

	const periodStart = run.payrollPeriodStart;
	const periodEnd = run.payrollPeriodEnd;

	// 2. Fetch active employees AND relevant terminated employees
	const employees = await db.query.employee.findMany({
		where: and(
			eq(employee.organizationId, organizationId),
			or(
				eq(employee.status, "active"),
				and(
					eq(employee.status, "terminated"),
					gte(employee.terminationDate, periodStart),
				),
			),
		),
	});

	return await db.transaction(async (tx: TransactionDb) => {
		let totalGross = 0;
		let totalDeductions = 0;
		let totalNet = 0;

		for (const emp of employees) {
			if (!emp.baseSalary) continue; // Skip employees without salary configured

			let baseSalary = Number(emp.baseSalary);
			let prorated = false;
			let prorationFactor = 1;

			// Unified Proration Logic
			// Determine effective start and end dates for the pay period
			const periodStartDate = new Date(periodStart);
			const periodEndDate = new Date(periodEnd);

			let effectiveStartDate = periodStartDate;
			let effectiveEndDate = periodEndDate;

			// Check for new hire (Joined after period start)
			if (emp.hireDate && emp.hireDate > periodStartDate) {
				effectiveStartDate = new Date(emp.hireDate);
			}

			// Check for termination (Left before period end)
			if (emp.terminationDate && emp.terminationDate < periodEndDate) {
				const termDate = new Date(emp.terminationDate);
				// If termination is before effective start, pay is 0 (shouldn't happen if query is correct)
				if (termDate < effectiveStartDate) {
					effectiveEndDate = effectiveStartDate; // Results in 0 days
				} else {
					effectiveEndDate = termDate;
				}
			}

			// Check if proration is needed
			// Prorate if effective dates differ from full period dates
			// Note: We compare times or just date strings. Here using getTime() simplified.
			// To be precise:
			// If effectiveStart > periodStart OR effectiveEnd < periodEnd => Prorate
			if (
				effectiveStartDate.getTime() > periodStartDate.getTime() ||
				effectiveEndDate.getTime() < periodEndDate.getTime()
			) {
				const totalDaysInPeriod =
					Math.floor(
						(periodEndDate.getTime() - periodStartDate.getTime()) /
							(1000 * 60 * 60 * 24),
					) + 1;

				const daysWorked =
					Math.floor(
						(effectiveEndDate.getTime() - effectiveStartDate.getTime()) /
							(1000 * 60 * 60 * 24),
					) + 1;

				if (totalDaysInPeriod > 0 && daysWorked > 0) {
					prorationFactor = daysWorked / totalDaysInPeriod;
					// Clamp between 0 and 1 just in case
					prorationFactor = Math.max(0, Math.min(1, prorationFactor));

					baseSalary = baseSalary * prorationFactor;
					prorated = true;
				} else if (daysWorked <= 0) {
					prorationFactor = 0;
					baseSalary = 0;
					prorated = true;
				}
			}

			let grossSalary = baseSalary;
			let deductions = 0;
			const components: Array<{
				componentId: string;
				name: string;
				type: "earning" | "deduction";
				amount: number;
			}> = [];

			// Process salary components from JSONB
			if (emp.salaryComponents && Array.isArray(emp.salaryComponents)) {
				for (const comp of emp.salaryComponents) {
					let amount = comp.amount || 0;

					// Optional: Prorate fixed components too?
					// Usually fixed allowances are prorated
					if (prorated) {
						amount = amount * prorationFactor;
					}

					// Fetch component details for name
					const componentDetails = await tx.query.salaryComponent.findFirst({
						where: eq(salaryComponent.id, comp.componentId),
					});

					if (componentDetails) {
						components.push({
							componentId: comp.componentId,
							name: componentDetails.name,
							type: comp.type,
							amount,
						});

						if (comp.type === "earning") {
							grossSalary += amount;
						} else if (comp.type === "deduction") {
							deductions += amount;
						}
					}
				}
			}

			// Process salary advance deductions
			const activeAdvances = await tx.query.salaryAdvance.findMany({
				where: and(
					eq(salaryAdvance.employeeId, emp.id),
					eq(salaryAdvance.status, "active"),
					sql`${salaryAdvance.outstandingBalance} > 0`,
				),
			});

			for (const advance of activeAdvances) {
				// Calculate monthly deduction based on approved amount and installments
				const deductionAmount = calculateAdvanceDeduction(
					Number(advance.outstandingBalance),
					Number(advance.approvedAmount || advance.requestedAmount),
					Number(advance.installments || 1),
				);

				if (deductionAmount > 0) {
					deductions += deductionAmount;
					components.push({
						componentId: advance.id,
						name: "Salary Advance Repayment",
						type: "deduction",
						amount: deductionAmount,
					});
				}
			}

			const netSalary = grossSalary - deductions;

			// Create Payroll Entry with components stored in JSONB
			await tx.insert(payrollEntry).values({
				payrollRunId: runId,
				employeeId: emp.id,
				baseSalary: baseSalary.toString(),
				grossSalary: grossSalary.toString(),
				totalDeductions: deductions.toString(),
				netSalary: netSalary.toString(),
				components, // Store as JSONB
				paymentMethod: "bank_transfer",
				status: "pending",
			});

			totalGross += grossSalary;
			totalDeductions += deductions;
			totalNet += netSalary;
		}

		// Update Run Totals
		await tx
			.update(payrollRun)
			.set({
				totalGross: totalGross.toString(),
				totalDeductions: totalDeductions.toString(),
				totalNet: totalNet.toString(),
				status: "calculated",
			})
			.where(eq(payrollRun.id, runId));
	});
}

function calculateAdvanceDeduction(
	outstandingBalance: number,
	approvedAmount: number,
	installments: number,
) {
	if (installments <= 0) return Math.min(outstandingBalance, approvedAmount);
	const monthlyDeduction = approvedAmount / installments;
	return Math.min(monthlyDeduction, outstandingBalance);
}

export async function approvePayrollRun(runId: string, userId: string) {
	return await db.transaction(async (tx: TransactionDb) => {
		// 1. Update Status
		const [run] = await tx
			.update(payrollRun)
			.set({
				status: "approved",
				approvedBy: userId,
				approvedAt: new Date(),
			})
			.where(eq(payrollRun.id, runId))
			.returning();

		// 2. Process Salary Advance Repayments
		const entries = await tx.query.payrollEntry.findMany({
			where: eq(payrollEntry.payrollRunId, runId),
		});

		for (const entry of entries) {
			// Find advance repayment components in the stored JSON
			// We look for components with type 'deduction' and a name indicating it's an advance repayment
			// OR we could check if componentId exists in salary_advance table (more robust but costlier per row if not batched)
			// Given the current structure, we'll try to match by ID if possible or rely on the fact that we push { componentId: advance.id }
			if (!entry.components || !Array.isArray(entry.components)) continue;

			for (const comp of entry.components) {
				// We need to know if this component is a salary advance repayment.
				// In calculatePayroll, we set:
				// componentId: advance.id
				// name: "Salary Advance Repayment"
				// type: "deduction"

				if (
					comp.type === "deduction" &&
					comp.name === "Salary Advance Repayment"
				) {
					const advanceId = comp.componentId;
					const deductionAmount = comp.amount;

					// Verify this is actually a valid advance
					const advance = await tx.query.salaryAdvance.findFirst({
						where: eq(salaryAdvance.id, advanceId),
					});

					if (advance) {
						const newBalance =
							Number(advance.outstandingBalance) - deductionAmount;

						// Update advance balance
						await tx
							.update(salaryAdvance)
							.set({
								outstandingBalance: newBalance.toString(),
								status: newBalance <= 0 ? "fully_repaid" : "active",
							})
							.where(eq(salaryAdvance.id, advanceId));
					}
				}
			}
		}

		return run;
	});
}

/**
 * ---------------------------------------------------------------------------
 * SALARY ADVANCE OPERATIONS
 * ---------------------------------------------------------------------------
 */

export async function requestSalaryAdvance(
	organizationId: string,
	data: {
		employeeId: string;
		amount: number;
		installments: number;
		notes?: string;
		createdBy?: string;
	},
) {
	const [advance] = await db
		.insert(salaryAdvance)
		.values({
			organizationId,
			employeeId: data.employeeId,
			requestedAmount: data.amount.toString(),
			installments: data.installments.toString(),
			status: "pending",
			notes: data.notes,
			createdBy: data.createdBy,
		})
		.returning();

	return advance;
}

export async function approveSalaryAdvance(
	advanceId: string,
	userId: string,
	approvedAmount?: number,
) {
	return await db.transaction(async (tx: TransactionDb) => {
		const advance = await tx.query.salaryAdvance.findFirst({
			where: eq(salaryAdvance.id, advanceId),
		});

		if (!advance) throw new Error("Advance request not found");

		const amount = approvedAmount || Number(advance.requestedAmount);

		const [updatedAdvance] = await tx
			.update(salaryAdvance)
			.set({
				status: "approved",
				approvedAmount: amount.toString(),
				outstandingBalance: amount.toString(),
				approvedBy: userId,
				approvedAt: new Date(),
			})
			.where(eq(salaryAdvance.id, advanceId))
			.returning();

		return updatedAdvance;
	});
}

export async function disburseSalaryAdvance(advanceId: string) {
	return await db
		.update(salaryAdvance)
		.set({
			status: "active",
			disbursedAt: new Date(),
		})
		.where(eq(salaryAdvance.id, advanceId))
		.returning();

	// TODO: Create Journal Entry for disbursement
	// Dr: Employee Advances (Asset)
	// Cr: Bank (Asset)
}

export async function getSalaryAdvances(
	organizationId: string,
	employeeId?: string,
) {
	const whereClause = employeeId
		? and(
				eq(salaryAdvance.organizationId, organizationId),
				eq(salaryAdvance.employeeId, employeeId),
			)
		: eq(salaryAdvance.organizationId, organizationId);

	return await db.query.salaryAdvance.findMany({
		where: whereClause,
		with: {
			employee: {
				columns: {
					firstName: true,
					lastName: true,
					employeeCode: true,
				},
			},
		},
		orderBy: [desc(salaryAdvance.createdAt)],
	});
}

/**
 * ---------------------------------------------------------------------------
 * SALARY COMPONENT OPERATIONS
 * ---------------------------------------------------------------------------
 */

export async function createSalaryComponent(
	organizationId: string,
	data: {
		name: string;
		componentType: "earning" | "deduction";
		accountId: string;
		isTaxable: boolean;
		createdBy?: string;
	},
) {
	const [component] = await db
		.insert(salaryComponent)
		.values({
			organizationId,
			...data,
		})
		.returning();

	return component;
}

export async function getSalaryComponents(organizationId: string) {
	return await db.query.salaryComponent.findMany({
		where: and(
			eq(salaryComponent.organizationId, organizationId),
			eq(salaryComponent.isActive, true),
		),
		orderBy: [salaryComponent.componentType, salaryComponent.name],
	});
}

export async function updateSalaryComponent(
	organizationId: string,
	componentId: string,
	data: {
		name?: string;
		componentType?: "earning" | "deduction";
		accountId?: string;
		isTaxable?: boolean;
	},
) {
	const [updated] = await db
		.update(salaryComponent)
		.set({ ...data, updatedAt: new Date() })
		.where(
			and(
				eq(salaryComponent.id, componentId),
				eq(salaryComponent.organizationId, organizationId),
			),
		)
		.returning();

	if (!updated) {
		throw new Error("Salary component not found");
	}

	return updated;
}

export async function deleteSalaryComponent(
	organizationId: string,
	componentId: string,
) {
	// Soft delete
	const [deleted] = await db
		.update(salaryComponent)
		.set({ isActive: false, deletedAt: new Date() })
		.where(
			and(
				eq(salaryComponent.id, componentId),
				eq(salaryComponent.organizationId, organizationId),
			),
		)
		.returning();

	if (!deleted) {
		throw new Error("Salary component not found");
	}

	return deleted;
}

export async function updatePayrollEntry(
	organizationId: string,
	runId: string,
	entryId: string,
	adjustments: Array<{
		id: string;
		name: string;
		type: "earning" | "deduction";
		amount: number;
		notes?: string;
	}>,
) {
	return await db.transaction(async (tx: TransactionDb) => {
		// 1. Get and validate entry
		const entry = await tx.query.payrollEntry.findFirst({
			where: and(
				eq(payrollEntry.id, entryId),
				eq(payrollEntry.payrollRunId, runId),
			),
		});

		if (!entry) throw new Error("Payroll entry not found");
		if (entry.status === "paid")
			throw new Error("Cannot update paid payroll entry");

		// 2. Calculate totals
		const { grossSalary, totalDeductions } = calculateTotals(
			Number(entry.baseSalary),
			entry.components,
			adjustments,
		);

		// 3. Update entry
		await tx
			.update(payrollEntry)
			.set({
				adjustments,
				grossSalary: grossSalary.toString(),
				totalDeductions: totalDeductions.toString(),
				netSalary: (grossSalary - totalDeductions).toString(),
				updatedAt: new Date(),
			})
			.where(eq(payrollEntry.id, entryId));

		// 4. Update payroll run totals
		await updatePayrollRunTotals(tx, runId, organizationId);

		return { success: true };
	});
}

/**
 * ---------------------------------------------------------------------------
 * PAYROLL QUERY OPERATIONS
 * ---------------------------------------------------------------------------
 */

export async function getPayrollRuns(organizationId: string) {
	return await db.query.payrollRun.findMany({
		where: eq(payrollRun.organizationId, organizationId),
		orderBy: [desc(payrollRun.payrollPeriodStart)],
	});
}

export async function getPayrollRunDetails(
	organizationId: string,
	runId: string,
	includeEntries = true,
) {
	const run = await db.query.payrollRun.findFirst({
		where: and(
			eq(payrollRun.id, runId),
			eq(payrollRun.organizationId, organizationId),
		),
	});

	if (!run) {
		throw new Error("Payroll run not found");
	}

	let entries = null;
	if (includeEntries) {
		entries = await db.query.payrollEntry.findMany({
			where: eq(payrollEntry.payrollRunId, runId),
			with: {
				employee: {
					columns: {
						firstName: true,
						lastName: true,
						employeeCode: true,
					},
				},
			},
		});
	}

	return { ...run, entries };
}

export async function processPayrollPayments(entryIds: string[]) {
	return await db.transaction(async (tx: TransactionDb) => {
		const entries = await tx.query.payrollEntry.findMany({
			where: inArray(payrollEntry.id, entryIds),
			with: {
				run: true,
			},
		});

		// Update entries to paid status
		await tx
			.update(payrollEntry)
			.set({
				status: "paid",
				updatedAt: new Date(),
			})
			.where(inArray(payrollEntry.id, entryIds));

		// Update payroll run status to paid if all entries are paid
		for (const entry of entries) {
			const [{ count: totalEntries }] = await tx
				.select({ count: sql<number>`count(*)` })
				.from(payrollEntry)
				.where(eq(payrollEntry.payrollRunId, entry.payrollRunId));

			const [{ count: paidEntries }] = await tx
				.select({ count: sql<number>`count(*)` })
				.from(payrollEntry)
				.where(
					and(
						eq(payrollEntry.payrollRunId, entry.payrollRunId),
						eq(payrollEntry.status, "paid"),
					),
				);

			if (totalEntries === paidEntries) {
				await tx
					.update(payrollRun)
					.set({
						status: "paid",
					})
					.where(eq(payrollRun.id, entry.payrollRunId));
			}
		}

		return { processedEntries: entryIds.length };
	});
}
