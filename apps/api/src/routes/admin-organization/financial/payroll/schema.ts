import { z } from "zod";

export const createEmployeeSchema = z.object({
	employeeCode: z.string().min(1),
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	email: z.string().email().optional(),
	phone: z.string().optional(),
	position: z.string().optional(),
	hireDate: z.coerce.date(),
	employmentType: z.enum(["full_time", "part_time", "contract"]),
	bankAccountNumber: z.string().optional(),
	taxId: z.string().optional(),
	baseSalary: z.string().optional(),
	currency: z.string().length(3).optional(),
	paymentFrequency: z.enum(["monthly", "bi_weekly", "weekly"]).optional(),
});

export const createSalaryStructureSchema = z.object({
	employeeId: z.string().uuid(),
	effectiveFrom: z.coerce.date(),
	baseSalary: z.string(),
	currency: z.string().length(3),
	paymentFrequency: z.enum(["monthly", "bi_weekly", "weekly"]),
	components: z.array(
		z.object({
			componentId: z.string().uuid(),
			amount: z.number().optional(),
			percentage: z.number().min(0).max(100).optional(),
			calculationBasis: z.enum(["base_salary", "gross_salary"]).optional(),
		}),
	),
});

export const createPayrollRunSchema = z.object({
	periodStart: z.coerce.date(),
	periodEnd: z.coerce.date(),
	paymentDate: z.coerce.date(),
});

export const requestSalaryAdvanceSchema = z.object({
	employeeId: z.string().uuid(),
	amount: z.number().positive(),
	installments: z.number().int().positive(),
	notes: z.string().optional(),
});

export const approveSalaryAdvanceSchema = z.object({
	approvedAmount: z.number().positive().optional(),
});

export const createSalaryComponentSchema = z.object({
	name: z.string().min(1, "Name is required"),
	componentType: z.enum(["earning", "deduction"]),
	calculationType: z.enum(["fixed", "percentage", "formula"]),
	accountId: z.string().uuid("Account is required"),
	isTaxable: z.boolean().default(true),
});

export const updateEmployeeSchema = z.object({
	firstName: z.string().min(1).optional(),
	lastName: z.string().min(1).optional(),
	email: z.string().email().optional(),
	phone: z.string().optional(),
	position: z.string().optional(),
	employmentType: z.enum(["full_time", "part_time", "contract"]).optional(),
	bankAccountNumber: z.string().optional(),
	taxId: z.string().optional(),
	status: z.enum(["active", "on_leave", "terminated"]).optional(),
	baseSalary: z.string().optional(),
	currency: z.string().length(3).optional(),
	paymentFrequency: z.enum(["monthly", "bi_weekly", "weekly"]).optional(),
	terminationDate: z.string().optional().nullable(),
	salaryComponents: z
		.array(
			z.object({
				componentId: z.string().uuid(),
				amount: z.number(),
				type: z.enum(["earning", "deduction"]),
			}),
		)
		.optional(),
});

export const getPayrollRunDetailsSchema = z.object({
	includeEntries: z.boolean().optional().default(true),
});

export const processPayrollPaymentsSchema = z.object({
	entryIds: z
		.array(z.string().uuid())
		.min(1, "At least one entry must be selected"),
});

export const updatePayrollEntrySchema = z.object({
	adjustments: z.array(
		z.object({
			id: z.string().uuid(),
			name: z.string().min(1, "Name is required"),
			type: z.enum(["earning", "deduction"]),
			amount: z.number().min(0),
			notes: z.string().optional(),
		}),
	),
});
