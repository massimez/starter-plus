import { relations } from "drizzle-orm";
import { accountCategory, accountType, glAccount } from "../financial/accounts";
import {
	bankAccount,
	bankReconciliation,
	bankTransaction,
} from "../financial/banking";
import { journalEntry, journalEntryLine } from "../financial/journal";
import {
	supplierInvoice,
	supplierInvoiceLine,
	supplierPayment,
	supplierPaymentAllocation,
} from "../financial/payables";
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
} from "../financial/payroll";
import {
	customerInvoice,
	customerInvoiceLine,
	customerPayment,
	customerPaymentAllocation,
} from "../financial/receivables";
import { taxAuthority, taxTransaction, taxType } from "../financial/tax";
import { organization } from "../organization";
import { client } from "../store/client";
import { supplier } from "../store/supplier";
import { user } from "../user";

/**
 * Chart of Accounts Relations
 */
export const accountTypeRelations = relations(accountType, ({ many }) => ({
	categories: many(accountCategory),
}));

export const accountCategoryRelations = relations(
	accountCategory,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [accountCategory.organizationId],
			references: [organization.id],
		}),
		accountType: one(accountType, {
			fields: [accountCategory.accountTypeId],
			references: [accountType.id],
		}),
		accounts: many(glAccount),
	}),
);

export const glAccountRelations = relations(glAccount, ({ one, many }) => ({
	organization: one(organization, {
		fields: [glAccount.organizationId],
		references: [organization.id],
	}),
	category: one(accountCategory, {
		fields: [glAccount.accountCategoryId],
		references: [accountCategory.id],
	}),
	parentAccount: one(glAccount, {
		fields: [glAccount.parentAccountId],
		references: [glAccount.id],
		relationName: "subAccounts",
	}),
	subAccounts: many(glAccount, {
		relationName: "subAccounts",
	}),
	journalLines: many(journalEntryLine),
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
		reversedBy: one(journalEntry, {
			fields: [journalEntry.reversedByEntryId],
			references: [journalEntry.id],
			relationName: "reversal",
		}),
		reverses: one(journalEntry, {
			fields: [journalEntry.reversedByEntryId],
			references: [journalEntry.id],
			relationName: "reversal",
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
 * Accounts Payable Relations
 */
export const supplierInvoiceRelations = relations(
	supplierInvoice,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [supplierInvoice.organizationId],
			references: [organization.id],
		}),
		supplier: one(supplier, {
			fields: [supplierInvoice.supplierId],
			references: [supplier.id],
		}),
		lines: many(supplierInvoiceLine),
		allocations: many(supplierPaymentAllocation),
		approvedBy: one(user, {
			fields: [supplierInvoice.approvedBy],
			references: [user.id],
		}),
	}),
);

export const supplierInvoiceLineRelations = relations(
	supplierInvoiceLine,
	({ one }) => ({
		invoice: one(supplierInvoice, {
			fields: [supplierInvoiceLine.supplierInvoiceId],
			references: [supplierInvoice.id],
		}),
		expenseAccount: one(glAccount, {
			fields: [supplierInvoiceLine.expenseAccountId],
			references: [glAccount.id],
		}),
	}),
);

export const supplierPaymentRelations = relations(
	supplierPayment,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [supplierPayment.organizationId],
			references: [organization.id],
		}),
		supplier: one(supplier, {
			fields: [supplierPayment.supplierId],
			references: [supplier.id],
		}),
		allocations: many(supplierPaymentAllocation),
		bankAccount: one(bankAccount, {
			fields: [supplierPayment.bankAccountId],
			references: [bankAccount.id],
		}),
	}),
);

export const supplierPaymentAllocationRelations = relations(
	supplierPaymentAllocation,
	({ one }) => ({
		payment: one(supplierPayment, {
			fields: [supplierPaymentAllocation.supplierPaymentId],
			references: [supplierPayment.id],
		}),
		invoice: one(supplierInvoice, {
			fields: [supplierPaymentAllocation.supplierInvoiceId],
			references: [supplierInvoice.id],
		}),
	}),
);

/**
 * Accounts Receivable Relations
 */
export const customerInvoiceRelations = relations(
	customerInvoice,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [customerInvoice.organizationId],
			references: [organization.id],
		}),
		customer: one(client, {
			fields: [customerInvoice.customerId],
			references: [client.id],
		}),
		lines: many(customerInvoiceLine),
		allocations: many(customerPaymentAllocation),
	}),
);

export const customerInvoiceLineRelations = relations(
	customerInvoiceLine,
	({ one }) => ({
		invoice: one(customerInvoice, {
			fields: [customerInvoiceLine.customerInvoiceId],
			references: [customerInvoice.id],
		}),
		revenueAccount: one(glAccount, {
			fields: [customerInvoiceLine.revenueAccountId],
			references: [glAccount.id],
		}),
	}),
);

export const customerPaymentRelations = relations(
	customerPayment,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [customerPayment.organizationId],
			references: [organization.id],
		}),
		customer: one(client, {
			fields: [customerPayment.customerId],
			references: [client.id],
		}),
		allocations: many(customerPaymentAllocation),
		bankAccount: one(bankAccount, {
			fields: [customerPayment.bankAccountId],
			references: [bankAccount.id],
		}),
	}),
);

export const customerPaymentAllocationRelations = relations(
	customerPaymentAllocation,
	({ one }) => ({
		payment: one(customerPayment, {
			fields: [customerPaymentAllocation.customerPaymentId],
			references: [customerPayment.id],
		}),
		invoice: one(customerInvoice, {
			fields: [customerPaymentAllocation.customerInvoiceId],
			references: [customerInvoice.id],
		}),
	}),
);

/**
 * Payroll Relations
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
	salaryStructures: many(salaryStructure),
	payrollEntries: many(payrollEntry),
	salaryAdvances: many(salaryAdvance),
}));

export const salaryStructureRelations = relations(
	salaryStructure,
	({ one, many }) => ({
		employee: one(employee, {
			fields: [salaryStructure.employeeId],
			references: [employee.id],
		}),
		components: many(employeeSalaryComponent),
	}),
);

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

export const employeeSalaryComponentRelations = relations(
	employeeSalaryComponent,
	({ one }) => ({
		structure: one(salaryStructure, {
			fields: [employeeSalaryComponent.salaryStructureId],
			references: [salaryStructure.id],
		}),
		component: one(salaryComponent, {
			fields: [employeeSalaryComponent.salaryComponentId],
			references: [salaryComponent.id],
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

export const payrollEntryRelations = relations(
	payrollEntry,
	({ one, many }) => ({
		run: one(payrollRun, {
			fields: [payrollEntry.payrollRunId],
			references: [payrollRun.id],
		}),
		employee: one(employee, {
			fields: [payrollEntry.employeeId],
			references: [employee.id],
		}),
		details: many(payrollEntryDetail),
	}),
);

export const payrollEntryDetailRelations = relations(
	payrollEntryDetail,
	({ one }) => ({
		entry: one(payrollEntry, {
			fields: [payrollEntryDetail.payrollEntryId],
			references: [payrollEntry.id],
		}),
		component: one(salaryComponent, {
			fields: [payrollEntryDetail.salaryComponentId],
			references: [salaryComponent.id],
		}),
		account: one(glAccount, {
			fields: [payrollEntryDetail.accountId],
			references: [glAccount.id],
		}),
	}),
);

export const salaryAdvanceRelations = relations(
	salaryAdvance,
	({ one, many }) => ({
		employee: one(employee, {
			fields: [salaryAdvance.employeeId],
			references: [employee.id],
		}),
		approvedBy: one(user, {
			fields: [salaryAdvance.approvedBy],
			references: [user.id],
		}),
		repayments: many(salaryAdvanceRepayment),
	}),
);

export const salaryAdvanceRepaymentRelations = relations(
	salaryAdvanceRepayment,
	({ one }) => ({
		advance: one(salaryAdvance, {
			fields: [salaryAdvanceRepayment.salaryAdvanceId],
			references: [salaryAdvance.id],
		}),
		payrollRun: one(payrollRun, {
			fields: [salaryAdvanceRepayment.payrollRunId],
			references: [payrollRun.id],
		}),
	}),
);

/**
 * Banking Relations
 */
export const bankAccountRelations = relations(bankAccount, ({ one, many }) => ({
	organization: one(organization, {
		fields: [bankAccount.organizationId],
		references: [organization.id],
	}),
	glAccount: one(glAccount, {
		fields: [bankAccount.glAccountId],
		references: [glAccount.id],
	}),
	transactions: many(bankTransaction),
	reconciliations: many(bankReconciliation),
}));

export const bankTransactionRelations = relations(
	bankTransaction,
	({ one }) => ({
		bankAccount: one(bankAccount, {
			fields: [bankTransaction.bankAccountId],
			references: [bankAccount.id],
		}),
	}),
);

export const bankReconciliationRelations = relations(
	bankReconciliation,
	({ one }) => ({
		bankAccount: one(bankAccount, {
			fields: [bankReconciliation.bankAccountId],
			references: [bankAccount.id],
		}),
		reconciledBy: one(user, {
			fields: [bankReconciliation.reconciledBy],
			references: [user.id],
		}),
	}),
);

/**
 * Tax Relations
 */
export const taxAuthorityRelations = relations(
	taxAuthority,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [taxAuthority.organizationId],
			references: [organization.id],
		}),
		taxTypes: many(taxType),
	}),
);

export const taxTypeRelations = relations(taxType, ({ one }) => ({
	authority: one(taxAuthority, {
		fields: [taxType.taxAuthorityId],
		references: [taxAuthority.id],
	}),
}));

export const taxTransactionRelations = relations(taxTransaction, ({ one }) => ({
	taxType: one(taxType, {
		fields: [taxTransaction.taxTypeId],
		references: [taxType.id],
	}),
}));
