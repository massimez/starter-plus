import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	employee,
	employeeSalaryComponent,
	payrollEntry,
	payrollEntryDetail,
	payrollRun,
	salaryAdvance,
	salaryAdvanceRepayment,
	salaryComponent,
	salaryStructure,
} from "@/lib/db/schema/financial/payroll";
import type { TransactionDb } from "@/types/db";

/**
 * ---------------------------------------------------------------------------
 * EMPLOYEE & SALARY STRUCTURE OPERATIONS
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

export async function createSalaryStructure(
	organizationId: string,
	data: {
		employeeId: string;
		effectiveFrom: Date;
		baseSalary: number;
		currency: string;
		paymentFrequency: "monthly" | "bi_weekly" | "weekly";
		components: {
			componentId: string;
			amount?: number;
			percentage?: number;
			calculationBasis?: "base_salary" | "gross_salary";
		}[];
		createdBy?: string;
	},
) {
	return await db.transaction(async (tx: TransactionDb) => {
		// 1. Create Structure Header
		const [structure] = await tx
			.insert(salaryStructure)
			.values({
				organizationId,
				employeeId: data.employeeId,
				effectiveFrom: data.effectiveFrom,
				baseSalary: data.baseSalary.toString(),
				currency: data.currency,
				paymentFrequency: data.paymentFrequency,
				isActive: true,
				createdBy: data.createdBy,
			})
			.returning();

		// 2. Create Components
		if (data.components.length > 0) {
			await tx.insert(employeeSalaryComponent).values(
				data.components.map((comp) => ({
					salaryStructureId: structure.id,
					salaryComponentId: comp.componentId,
					amount: comp.amount?.toString(),
					percentage: comp.percentage?.toString(),
					calculationBasis: comp.calculationBasis,
					createdBy: data.createdBy,
				})),
			);
		}

		return structure;
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
				inArray(payrollRun.status, ["draft", "calculated"]),
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
	// 1. Fetch active employees
	const employees = await db.query.employee.findMany({
		where: and(
			eq(employee.organizationId, organizationId),
			eq(employee.status, "active"),
		),
		with: {
			salaryStructures: {
				where: eq(salaryStructure.isActive, true),
				with: {
					components: {
						with: {
							component: true,
						},
					},
				},
				limit: 1,
				orderBy: [desc(salaryStructure.effectiveFrom)],
			},
		},
	});

	return await db.transaction(async (tx: TransactionDb) => {
		let totalGross = 0;
		let totalDeductions = 0;
		let totalNet = 0;

		for (const emp of employees) {
			const structure = emp.salaryStructures[0];
			if (!structure) continue;

			const baseSalary = Number(structure.baseSalary);
			let grossSalary = baseSalary;
			let deductions = 0;
			const entryDetails = [];

			// Process salary components
			for (const compLink of structure.components) {
				let amount = 0;
				if (compLink.amount) {
					amount = Number(compLink.amount);
				} else if (compLink.percentage) {
					const basis =
						compLink.calculationBasis === "gross_salary"
							? grossSalary
							: baseSalary;
					amount = basis * (Number(compLink.percentage) / 100);
				}

				if (compLink.component.componentType === "earning") {
					grossSalary += amount;
				} else if (compLink.component.componentType === "deduction") {
					deductions += amount;
				}

				entryDetails.push({
					salaryComponentId: compLink.salaryComponentId,
					amount: amount.toString(),
					isTaxable: compLink.component.isTaxable,
					accountId: compLink.component.accountId,
				});
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
				const deductionAmount = Math.min(
					Number(advance.deductionPerPayroll || 0),
					Number(advance.outstandingBalance),
				);

				if (deductionAmount > 0) {
					deductions += deductionAmount;
				}
			}

			const netSalary = grossSalary - deductions;

			// Create Payroll Entry
			const [entry] = await tx
				.insert(payrollEntry)
				.values({
					payrollRunId: runId,
					employeeId: emp.id,
					baseSalary: baseSalary.toString(),
					grossSalary: grossSalary.toString(),
					totalDeductions: deductions.toString(),
					netSalary: netSalary.toString(),
					paymentMethod: "bank_transfer",
					status: "pending",
				})
				.returning();

			// Save details
			if (entryDetails.length > 0) {
				await tx.insert(payrollEntryDetail).values(
					entryDetails.map((detail) => ({
						payrollEntryId: entry.id,
						...detail,
					})),
				);
			}

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
				const deductionAmount = Math.min(
					Number(advance.deductionPerPayroll || 0),
					Number(advance.outstandingBalance),
				);

				if (deductionAmount > 0) {
					const newBalance =
						Number(advance.outstandingBalance) - deductionAmount;

					// Create repayment record
					await tx.insert(salaryAdvanceRepayment).values({
						salaryAdvanceId: advance.id,
						payrollRunId: runId,
						repaymentAmount: deductionAmount.toString(),
						balanceAfter: newBalance.toString(),
					});

					// Update advance balance
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
		installments: number;
		notes?: string;
		createdBy?: string;
	},
) {
	const deductionPerPayroll = data.amount / data.installments;

	const [advance] = await db
		.insert(salaryAdvance)
		.values({
			organizationId,
			employeeId: data.employeeId,
			requestedAmount: data.amount.toString(),
			numberOfInstallments: data.installments,
			deductionPerPayroll: deductionPerPayroll.toString(),
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
		const deduction = amount / advance.numberOfInstallments;

		const [updatedAdvance] = await tx
			.update(salaryAdvance)
			.set({
				status: "approved",
				approvedAmount: amount.toString(),
				deductionPerPayroll: deduction.toString(),
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

export async function getEmployees(organizationId: string) {
	return await db.query.employee.findMany({
		where: eq(employee.organizationId, organizationId),
		with: {
			salaryStructures: {
				where: eq(salaryStructure.isActive, true),
				limit: 1,
				orderBy: [desc(salaryStructure.effectiveFrom)],
			},
		},
	});
}

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
				details: {
					with: {
						component: {
							columns: {
								name: true,
								componentType: true,
							},
						},
					},
				},
			},
		});
	}

	return { ...run, entries };
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
	},
) {
	const [updated] = await db
		.update(employee)
		.set(data)
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

export async function createSalaryComponent(
	organizationId: string,
	data: {
		name: string;
		componentType: "earning" | "deduction" | "employer_contribution";
		calculationType: "fixed" | "percentage" | "formula";
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

export async function getSalaryStructures(organizationId: string) {
	return await db.query.salaryStructure.findMany({
		where: and(
			eq(salaryStructure.organizationId, organizationId),
			eq(salaryStructure.isActive, true),
		),
		with: {
			employee: {
				columns: {
					firstName: true,
					lastName: true,
					employeeCode: true,
				},
			},
			components: {
				with: {
					component: {
						columns: {
							name: true,
							componentType: true,
						},
					},
				},
			},
		},
		orderBy: [desc(salaryStructure.effectiveFrom)],
	});
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
						postedAt: new Date(),
					})
					.where(eq(payrollRun.id, entry.payrollRunId));
			}
		}

		return { processedEntries: entryIds.length };
	});
}
