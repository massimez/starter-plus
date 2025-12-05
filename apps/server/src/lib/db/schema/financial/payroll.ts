import { sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { softAudit } from "../helpers/common";
import { organization } from "../organization";
import { user } from "../user";
import { glAccount } from "./accounts";

/**
 * ---------------------------------------------------------------------------
 * PAYROLL & SALARY MANAGEMENT
 * ---------------------------------------------------------------------------
 */

/**
 * Employees
 * Employee master data
 */
export const employee = pgTable(
	"employee",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),

		// Link to user account (optional - for employees with system access)
		userId: text("user_id").references(() => user.id, { onDelete: "set null" }),

		// Employee identification
		employeeCode: varchar("employee_code", { length: 50 }).notNull(),
		firstName: varchar("first_name", { length: 100 }).notNull(),
		lastName: varchar("last_name", { length: 100 }).notNull(),
		email: varchar("email", { length: 255 }),
		phone: varchar("phone", { length: 50 }),

		// Employment details
		departmentId: uuid("department_id"), // Future: link to department table
		position: varchar("position", { length: 100 }),
		hireDate: timestamp("hire_date", { withTimezone: false }).notNull(),
		employmentType: varchar("employment_type", { length: 20 })
			.notNull()
			.$type<"full_time" | "part_time" | "contract">(),

		// Status
		status: varchar("status", { length: 20 })
			.default("active")
			.notNull()
			.$type<"active" | "on_leave" | "terminated">(),
		terminationDate: timestamp("termination_date", { withTimezone: false }),

		// Additional info
		bankAccountNumber: varchar("bank_account_number", { length: 100 }),
		taxId: varchar("tax_id", { length: 50 }),
		metadata: jsonb("metadata"),

		...softAudit,
	},
	(table) => [
		index("employee_org_idx").on(table.organizationId),
		index("employee_code_idx").on(table.organizationId, table.employeeCode),
		index("employee_status_idx").on(table.status),
	],
);

/**
 * Salary Structures
 * Employee salary configuration with effective dates
 */
export const salaryStructure = pgTable(
	"salary_structure",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		employeeId: uuid("employee_id")
			.notNull()
			.references(() => employee.id, { onDelete: "cascade" }),

		effectiveFrom: timestamp("effective_from", {
			withTimezone: false,
		}).notNull(),
		effectiveTo: timestamp("effective_to", { withTimezone: false }),

		baseSalary: numeric("base_salary", { precision: 12, scale: 2 }).notNull(),
		currency: varchar("currency", { length: 3 }).notNull(),
		paymentFrequency: varchar("payment_frequency", { length: 20 })
			.notNull()
			.$type<"monthly" | "bi_weekly" | "weekly">(),

		isActive: boolean("is_active").default(true).notNull(),

		...softAudit,
	},
	(table) => [
		index("salary_structure_org_idx").on(table.organizationId),
		index("salary_structure_employee_idx").on(table.employeeId),
		index("salary_structure_effective_idx").on(
			table.effectiveFrom,
			table.effectiveTo,
		),
	],
);

/**
 * Salary Components
 * Reusable salary component definitions (allowances, deductions, etc.)
 */
export const salaryComponent = pgTable(
	"salary_component",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),

		name: varchar("name", { length: 100 }).notNull(),
		componentType: varchar("component_type", { length: 30 })
			.notNull()
			.$type<"earning" | "deduction" | "employer_contribution">(),
		calculationType: varchar("calculation_type", { length: 20 })
			.notNull()
			.$type<"fixed" | "percentage" | "formula">(),

		isTaxable: boolean("is_taxable").default(true).notNull(),
		accountId: uuid("account_id")
			.notNull()
			.references(() => glAccount.id, { onDelete: "restrict" }),

		isActive: boolean("is_active").default(true).notNull(),

		...softAudit,
	},
	(table) => [
		index("salary_component_org_idx").on(table.organizationId),
		index("salary_component_type_idx").on(table.componentType),
	],
);

/**
 * Employee Salary Components
 * Links employees to salary components with amounts
 */
export const employeeSalaryComponent = pgTable(
	"employee_salary_component",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		salaryStructureId: uuid("salary_structure_id")
			.notNull()
			.references(() => salaryStructure.id, { onDelete: "cascade" }),
		salaryComponentId: uuid("salary_component_id")
			.notNull()
			.references(() => salaryComponent.id, { onDelete: "restrict" }),

		amount: numeric("amount", { precision: 12, scale: 2 }), // For fixed amounts
		percentage: numeric("percentage", { precision: 5, scale: 2 }), // For percentage-based
		calculationBasis: varchar("calculation_basis", { length: 20 }).$type<
			"base_salary" | "gross_salary"
		>(),

		...softAudit,
	},
	(table) => [
		index("employee_salary_component_structure_idx").on(
			table.salaryStructureId,
		),
		index("employee_salary_component_component_idx").on(
			table.salaryComponentId,
		),
	],
);

/**
 * Payroll Runs
 * Batch payroll processing records
 */
export const payrollRun = pgTable(
	"payroll_run",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),

		payrollPeriodStart: timestamp("payroll_period_start", {
			withTimezone: false,
		}).notNull(),
		payrollPeriodEnd: timestamp("payroll_period_end", {
			withTimezone: false,
		}).notNull(),
		paymentDate: timestamp("payment_date", { withTimezone: false }).notNull(),

		status: varchar("status", { length: 20 })
			.default("draft")
			.notNull()
			.$type<"draft" | "calculated" | "approved" | "paid" | "posted">(),

		// Totals
		totalGross: numeric("total_gross", { precision: 12, scale: 2 }).default(
			"0",
		),
		totalDeductions: numeric("total_deductions", {
			precision: 12,
			scale: 2,
		}).default("0"),
		totalNet: numeric("total_net", { precision: 12, scale: 2 }).default("0"),
		totalEmployerContributions: numeric("total_employer_contributions", {
			precision: 12,
			scale: 2,
		}).default("0"),

		// Approval tracking
		approvedBy: text("approved_by").references(() => user.id, {
			onDelete: "set null",
		}),
		approvedAt: timestamp("approved_at", { withTimezone: false }),
		postedAt: timestamp("posted_at", { withTimezone: false }),

		...softAudit,
	},
	(table) => [
		index("payroll_run_org_idx").on(table.organizationId),
		index("payroll_run_period_idx").on(
			table.payrollPeriodStart,
			table.payrollPeriodEnd,
		),
		index("payroll_run_status_idx").on(table.status),
	],
);

/**
 * Payroll Entries
 * Individual employee payroll records within a payroll run
 */
export const payrollEntry = pgTable(
	"payroll_entry",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		payrollRunId: uuid("payroll_run_id")
			.notNull()
			.references(() => payrollRun.id, { onDelete: "cascade" }),
		employeeId: uuid("employee_id")
			.notNull()
			.references(() => employee.id, { onDelete: "restrict" }),

		baseSalary: numeric("base_salary", { precision: 12, scale: 2 }).notNull(),
		grossSalary: numeric("gross_salary", { precision: 12, scale: 2 }).notNull(),
		totalDeductions: numeric("total_deductions", {
			precision: 12,
			scale: 2,
		}).default("0"),
		netSalary: numeric("net_salary", { precision: 12, scale: 2 }).notNull(),
		employerContributions: numeric("employer_contributions", {
			precision: 12,
			scale: 2,
		}).default("0"),

		paymentMethod: varchar("payment_method", { length: 20 })
			.notNull()
			.$type<"bank_transfer" | "cash" | "check">(),
		bankAccountNumber: varchar("bank_account_number", { length: 100 }),

		status: varchar("status", { length: 20 })
			.default("pending")
			.notNull()
			.$type<"pending" | "paid">(),

		...softAudit,
	},
	(table) => [
		index("payroll_entry_run_idx").on(table.payrollRunId),
		index("payroll_entry_employee_idx").on(table.employeeId),
	],
);

/**
 * Payroll Entry Details
 * Line-by-line breakdown of salary components for each payroll entry
 */
export const payrollEntryDetail = pgTable(
	"payroll_entry_detail",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		payrollEntryId: uuid("payroll_entry_id")
			.notNull()
			.references(() => payrollEntry.id, { onDelete: "cascade" }),
		salaryComponentId: uuid("salary_component_id")
			.notNull()
			.references(() => salaryComponent.id, { onDelete: "restrict" }),

		amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
		isTaxable: boolean("is_taxable").default(true).notNull(),
		accountId: uuid("account_id")
			.notNull()
			.references(() => glAccount.id, { onDelete: "restrict" }),

		...softAudit,
	},
	(table) => [
		index("payroll_entry_detail_entry_idx").on(table.payrollEntryId),
		index("payroll_entry_detail_component_idx").on(table.salaryComponentId),
	],
);

/**
 * Salary Advances
 * Employee salary advance requests and tracking
 */
export const salaryAdvance = pgTable(
	"salary_advance",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		employeeId: uuid("employee_id")
			.notNull()
			.references(() => employee.id, { onDelete: "cascade" }),

		requestDate: timestamp("request_date", { withTimezone: false })
			.defaultNow()
			.notNull(),
		requestedAmount: numeric("requested_amount", {
			precision: 12,
			scale: 2,
		}).notNull(),
		approvedAmount: numeric("approved_amount", { precision: 12, scale: 2 }),

		// Repayment terms
		numberOfInstallments: integer("number_of_installments")
			.default(1)
			.notNull(),
		deductionPerPayroll: numeric("deduction_per_payroll", {
			precision: 12,
			scale: 2,
		}),

		// Tracking
		outstandingBalance: numeric("outstanding_balance", {
			precision: 12,
			scale: 2,
		}).default("0"),

		status: varchar("status", { length: 20 })
			.default("pending")
			.notNull()
			.$type<"pending" | "approved" | "rejected" | "active" | "fully_repaid">(),

		// Approval/rejection
		approvedBy: text("approved_by").references(() => user.id, {
			onDelete: "set null",
		}),
		approvedAt: timestamp("approved_at", { withTimezone: false }),
		rejectedBy: text("rejected_by").references(() => user.id, {
			onDelete: "set null",
		}),
		rejectedAt: timestamp("rejected_at", { withTimezone: false }),
		rejectionReason: text("rejection_reason"),

		// Disbursement
		disbursedAt: timestamp("disbursed_at", { withTimezone: false }),

		notes: text("notes"),

		...softAudit,
	},
	(table) => [
		index("salary_advance_org_idx").on(table.organizationId),
		index("salary_advance_employee_idx").on(table.employeeId),
		index("salary_advance_status_idx").on(table.status),
	],
);

/**
 * Salary Advance Repayments
 * Tracks repayments of salary advances through payroll deductions
 */
export const salaryAdvanceRepayment = pgTable(
	"salary_advance_repayment",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		salaryAdvanceId: uuid("salary_advance_id")
			.notNull()
			.references(() => salaryAdvance.id, { onDelete: "cascade" }),
		payrollRunId: uuid("payroll_run_id")
			.notNull()
			.references(() => payrollRun.id, { onDelete: "restrict" }),

		repaymentAmount: numeric("repayment_amount", {
			precision: 12,
			scale: 2,
		}).notNull(),
		balanceAfter: numeric("balance_after", {
			precision: 12,
			scale: 2,
		}).notNull(),

		...softAudit,
	},
	(table) => [
		index("salary_advance_repayment_advance_idx").on(table.salaryAdvanceId),
		index("salary_advance_repayment_payroll_idx").on(table.payrollRunId),
	],
);
