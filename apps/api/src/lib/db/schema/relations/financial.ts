import { relations } from "drizzle-orm";
import { glAccount } from "../financial/accounts";
import {
	invoice,
	invoiceLine,
	payment,
	paymentAllocation,
} from "../financial/invoices";
import { journalEntry, journalEntryLine } from "../financial/journal";
import {
	employee,
	payrollEntry,
	payrollRun,
	salaryAdvance,
	salaryComponent,
} from "../financial/payroll";
import { organization } from "../organization";
import { client } from "../store/client";
import { supplier } from "../store/supplier";
import { user } from "../user";

/**
 * Chart of Accounts Relations - Simplified
 */
export const glAccountRelations = relations(glAccount, ({ one, many }) => ({
	organization: one(organization, {
		fields: [glAccount.organizationId],
		references: [organization.id],
	}),
	journalLines: many(journalEntryLine),
	invoiceLines: many(invoiceLine),
}));

/**
 * Journal Entry Relations
 */
export const journalEntryRelations = relations(
	journalEntry,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [journalEntry.organizationId],
			references: [organization.id],
		}),
		lines: many(journalEntryLine),
		approvedBy: one(user, {
			fields: [journalEntry.approvedBy],
			references: [user.id],
		}),
	}),
);

export const journalEntryLineRelations = relations(
	journalEntryLine,
	({ one }) => ({
		journalEntry: one(journalEntry, {
			fields: [journalEntryLine.journalEntryId],
			references: [journalEntry.id],
		}),
		account: one(glAccount, {
			fields: [journalEntryLine.accountId],
			references: [glAccount.id],
		}),
	}),
);

/**
 * Invoice Relations - Unified
 */
export const invoiceRelations = relations(invoice, ({ one, many }) => ({
	organization: one(organization, {
		fields: [invoice.organizationId],
		references: [organization.id],
	}),
	customer: one(client, {
		fields: [invoice.customerId],
		references: [client.id],
	}),
	supplier: one(supplier, {
		fields: [invoice.supplierId],
		references: [supplier.id],
	}),
	lines: many(invoiceLine),
	allocations: many(paymentAllocation),
}));

export const invoiceLineRelations = relations(invoiceLine, ({ one }) => ({
	invoice: one(invoice, {
		fields: [invoiceLine.invoiceId],
		references: [invoice.id],
	}),
	account: one(glAccount, {
		fields: [invoiceLine.accountId],
		references: [glAccount.id],
	}),
}));

/**
 * Payment Relations - Unified
 */
export const paymentRelations = relations(payment, ({ one, many }) => ({
	organization: one(organization, {
		fields: [payment.organizationId],
		references: [organization.id],
	}),
	customer: one(client, {
		fields: [payment.customerId],
		references: [client.id],
	}),
	supplier: one(supplier, {
		fields: [payment.supplierId],
		references: [supplier.id],
	}),
	allocations: many(paymentAllocation),
}));

export const paymentAllocationRelations = relations(
	paymentAllocation,
	({ one }) => ({
		payment: one(payment, {
			fields: [paymentAllocation.paymentId],
			references: [payment.id],
		}),
		invoice: one(invoice, {
			fields: [paymentAllocation.invoiceId],
			references: [invoice.id],
		}),
	}),
);

/**
 * Payroll Relations - Simplified
 */
export const employeeRelations = relations(employee, ({ one, many }) => ({
	organization: one(organization, {
		fields: [employee.organizationId],
		references: [organization.id],
	}),
	user: one(user, {
		fields: [employee.userId],
		references: [user.id],
	}),
	payrollEntries: many(payrollEntry),
	salaryAdvances: many(salaryAdvance),
}));

export const salaryComponentRelations = relations(
	salaryComponent,
	({ one }) => ({
		organization: one(organization, {
			fields: [salaryComponent.organizationId],
			references: [organization.id],
		}),
		account: one(glAccount, {
			fields: [salaryComponent.accountId],
			references: [glAccount.id],
		}),
	}),
);

export const payrollRunRelations = relations(payrollRun, ({ one, many }) => ({
	organization: one(organization, {
		fields: [payrollRun.organizationId],
		references: [organization.id],
	}),
	entries: many(payrollEntry),
	approvedBy: one(user, {
		fields: [payrollRun.approvedBy],
		references: [user.id],
	}),
}));

export const payrollEntryRelations = relations(payrollEntry, ({ one }) => ({
	run: one(payrollRun, {
		fields: [payrollEntry.payrollRunId],
		references: [payrollRun.id],
	}),
	employee: one(employee, {
		fields: [payrollEntry.employeeId],
		references: [employee.id],
	}),
}));

export const salaryAdvanceRelations = relations(salaryAdvance, ({ one }) => ({
	organization: one(organization, {
		fields: [salaryAdvance.organizationId],
		references: [organization.id],
	}),
	employee: one(employee, {
		fields: [salaryAdvance.employeeId],
		references: [employee.id],
	}),
	approvedBy: one(user, {
		fields: [salaryAdvance.approvedBy],
		references: [user.id],
	}),
	rejectedBy: one(user, {
		fields: [salaryAdvance.rejectedBy],
		references: [user.id],
	}),
}));
