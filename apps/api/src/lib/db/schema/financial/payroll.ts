import { sql } from "drizzle-orm";
import {
	boolean,
	index,
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
 * Employees - Simplified with embedded salary structure
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
		position: varchar("position", { length: 100 }),
		hireDate: timestamp("hire_date", { withTimezone: false }).notNull(),
		employmentType: varchar("employment_type", { length: 20 })
			.notNull()
			.$type<"full_time" | "part_time" | "contract">(), // Application-level validation

		// Salary information (embedded instead of separate table)
		baseSalary: numeric("base_salary", { precision: 12, scale: 2 }),
		currency: varchar("currency", { length: 3 }),
		paymentFrequency: varchar("payment_frequency", { length: 20 }).$type<
			"monthly" | "bi_weekly" | "weekly"
		>(), // Application-level validation

		// Salary components (allowances, deductions) stored as JSON
		salaryComponents:
			jsonb("salary_components").$type<
				Array<{
					componentId: string;
					amount: number;
					type: "earning" | "deduction";
				}>
			>(),

		// Status
		status: varchar("status", { length: 20 })
			.default("active")
			.notNull()
			.$type<"active" | "on_leave" | "terminated">(), // Application-level validation
		terminationDate: timestamp("termination_date", { withTimezone: false }),

		// Payment info
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
 * Salary Components - Reusable component definitions
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
			.$type<"earning" | "deduction">(), // Application-level validation

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
 * Payroll Runs - Simplified
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
			.$type<"draft" | "calculated" | "approved" | "paid">(), // Application-level validation

		// Totals
		totalGross: numeric("total_gross", { precision: 12, scale: 2 }).default(
			"0",
		),
		totalDeductions: numeric("total_deductions", {
			precision: 12,
			scale: 2,
		}).default("0"),
		totalNet: numeric("total_net", { precision: 12, scale: 2 }).default("0"),

		// Approval tracking
		approvedBy: text("approved_by").references(() => user.id, {
			onDelete: "set null",
		}),
		approvedAt: timestamp("approved_at", { withTimezone: false }),

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
 * Payroll Entries - Individual employee payroll records
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

		// Component breakdown stored as JSON
		components:
			jsonb("components").$type<
				Array<{
					componentId: string;
					name: string;
					type: "earning" | "deduction";
					amount: number;
				}>
			>(),

		// Adjustments (one-off additions/deductions for this run)
		adjustments:
			jsonb("adjustments").$type<
				Array<{
					id: string;
					name: string;
					type: "earning" | "deduction";
					amount: number;
					notes?: string;
				}>
			>(),

		paymentMethod: varchar("payment_method", { length: 20 })
			.notNull()
			.$type<"bank_transfer" | "cash" | "check">(), // Application-level validation
		bankAccountNumber: varchar("bank_account_number", { length: 100 }),

		status: varchar("status", { length: 20 })
			.default("pending")
			.notNull()
			.$type<"pending" | "paid">(), // Application-level validation

		...softAudit,
	},
	(table) => [
		index("payroll_entry_run_idx").on(table.payrollRunId),
		index("payroll_entry_employee_idx").on(table.employeeId),
	],
);

/**
 * Salary Advances - Simplified
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

		installments: numeric("installments", { precision: 12, scale: 0 })
			.default("1")
			.notNull(),

		// Tracking
		outstandingBalance: numeric("outstanding_balance", {
			precision: 12,
			scale: 2,
		}).default("0"),

		status: varchar("status", { length: 20 })
			.default("pending")
			.notNull()
			.$type<"pending" | "approved" | "rejected" | "active" | "fully_repaid">(), // Application-level validation

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
