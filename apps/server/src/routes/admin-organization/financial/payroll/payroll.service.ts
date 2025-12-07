import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	employee,
	payrollEntry,
	payrollRun,
	salaryAdvance,
	salaryComponent,
} from "@/lib/db/schema/financial/payroll";
import type { TransactionDb } from "@/types/db";

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
		baseSalary?: number;
		currency?: string;
		paymentFrequency?: "monthly" | "bi_weekly" | "weekly";
		salaryComponents?: Array<{
			componentId: string;
			amount: number;
			type: "earning" | "deduction";
		}>;
	},
) {
	// biome-ignore lint/suspicious/noExplicitAny: <>
	const updateData: any = { ...data };

	// Convert baseSalary number to string for database
	if (data.baseSalary !== undefined) {
		updateData.baseSalary = data.baseSalary.toString();
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
	// 1. Fetch active employees with their salary info
	const employees = await db.query.employee.findMany({
		where: and(
			eq(employee.organizationId, organizationId),
			eq(employee.status, "active"),
		),
	});

	return await db.transaction(async (tx: TransactionDb) => {
		let totalGross = 0;
		let totalDeductions = 0;
		let totalNet = 0;

		for (const emp of employees) {
			if (!emp.baseSalary) continue; // Skip employees without salary configured

			const baseSalary = Number(emp.baseSalary);
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
					const amount = comp.amount || 0;

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
				// Calculate monthly deduction (outstanding balance divided by remaining months)
				const deductionAmount = Math.min(
					Number(advance.outstandingBalance) / 3, // Simple: divide by 3 months
					Number(advance.outstandingBalance),
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
				status: "approved", // Move directly to approved after calculation
			})
			.where(eq(payrollRun.id, runId));
	});
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
			const activeAdvances = await tx.query.salaryAdvance.findMany({
				where: and(
					eq(salaryAdvance.employeeId, entry.employeeId),
					eq(salaryAdvance.status, "active"),
					sql`${salaryAdvance.outstandingBalance} > 0`,
				),
			});

			for (const advance of activeAdvances) {
				// Calculate monthly deduction
				const deductionAmount = Math.min(
					Number(advance.outstandingBalance) / 3,
					Number(advance.outstandingBalance),
				);

				if (deductionAmount > 0) {
					const newBalance =
						Number(advance.outstandingBalance) - deductionAmount;

					// Update advance balance (no separate repayment table)
					await tx
						.update(salaryAdvance)
						.set({
							outstandingBalance: newBalance.toString(),
							status: newBalance <= 0 ? "fully_repaid" : "active",
						})
						.where(eq(salaryAdvance.id, advance.id));
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
			where: eq(payrollEntry.id, sql`ANY(${entryIds})`),
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
			.where(eq(payrollEntry.id, sql`ANY(${entryIds})`));

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
