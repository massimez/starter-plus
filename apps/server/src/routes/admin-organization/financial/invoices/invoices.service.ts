import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	invoice,
	invoiceLine,
	payment,
	paymentAllocation,
} from "@/lib/db/schema/financial/invoices";
import type { TransactionDb } from "@/types/db";

/**
 * ---------------------------------------------------------------------------
 * UNIFIED INVOICE OPERATIONS (Receivables & Payables)
 * ---------------------------------------------------------------------------
 */

export async function createInvoice(
	organizationId: string,
	data: {
		invoiceType: "receivable" | "payable";
		customerId?: string;
		supplierId?: string;
		invoiceNumber: string;
		invoiceDate: Date;
		dueDate: Date;
		currency: string;
		items: {
			accountId: string; // revenue or expense account
			description: string;
			quantity: number;
			unitPrice: number;
			taxRate?: number;
		}[];
		createdBy?: string;
	},
) {
	// Calculate totals
	let totalAmount = 0;
	let totalTax = 0;
	const linesData = data.items.map((item) => {
		const lineTotal = item.quantity * item.unitPrice;
		const tax = lineTotal * ((item.taxRate || 0) / 100);
		totalAmount += lineTotal + tax;
		totalTax += tax;
		return {
			...item,
			totalAmount: lineTotal + tax,
			taxAmount: tax,
		};
	});

	return await db.transaction(async (tx: TransactionDb) => {
		// 1. Create Invoice Header
		const [newInvoice] = await tx
			.insert(invoice)
			.values({
				organizationId,
				invoiceType: data.invoiceType,
				partyType: data.invoiceType === "receivable" ? "customer" : "supplier",
				customerId: data.customerId,
				supplierId: data.supplierId,
				invoiceNumber: data.invoiceNumber,
				invoiceDate: data.invoiceDate,
				dueDate: data.dueDate,
				currency: data.currency,
				totalAmount: totalAmount.toString(),
				taxAmount: totalTax.toString(),
				netAmount: (totalAmount - totalTax).toString(),
				status: "draft",
				createdBy: data.createdBy,
			})
			.returning();

		// 2. Create Invoice Lines
		if (linesData.length > 0) {
			await tx.insert(invoiceLine).values(
				linesData.map((line) => ({
					invoiceId: newInvoice.id,
					accountId: line.accountId,
					description: line.description,
					quantity: line.quantity.toString(),
					unitPrice: line.unitPrice.toString(),
					taxRate: (line.taxRate || 0).toString(),
					taxAmount: line.taxAmount.toString(),
					totalAmount: line.totalAmount.toString(),
					createdBy: data.createdBy,
				})),
			);
		}

		return newInvoice;
	});
}

export async function updateInvoice(
	organizationId: string,
	invoiceId: string,
	data: {
		invoiceType: "receivable" | "payable";
		customerId?: string;
		supplierId?: string;
		invoiceNumber: string;
		invoiceDate: Date;
		dueDate: Date;
		currency: string;
		items: {
			accountId: string;
			description: string;
			quantity: number;
			unitPrice: number;
			taxRate?: number;
		}[];
		updatedBy?: string;
	},
) {
	// Calculate totals
	let totalAmount = 0;
	let totalTax = 0;
	const linesData = data.items.map((item) => {
		const lineTotal = item.quantity * item.unitPrice;
		const tax = lineTotal * ((item.taxRate || 0) / 100);
		totalAmount += lineTotal + tax;
		totalTax += tax;
		return {
			...item,
			totalAmount: lineTotal + tax,
			taxAmount: tax,
		};
	});

	return await db.transaction(async (tx: TransactionDb) => {
		// 1. Update Invoice Header
		const [updatedInvoice] = await tx
			.update(invoice)
			.set({
				invoiceType: data.invoiceType,
				partyType: data.invoiceType === "receivable" ? "customer" : "supplier",
				customerId: data.customerId,
				supplierId: data.supplierId,
				invoiceNumber: data.invoiceNumber,
				invoiceDate: data.invoiceDate,
				dueDate: data.dueDate,
				currency: data.currency,
				totalAmount: totalAmount.toString(),
				taxAmount: totalTax.toString(),
				netAmount: (totalAmount - totalTax).toString(),
				updatedBy: data.updatedBy,
			})
			.where(
				and(
					eq(invoice.id, invoiceId),
					eq(invoice.organizationId, organizationId),
					eq(invoice.status, "draft"),
				),
			)
			.returning();

		if (!updatedInvoice) {
			throw new Error("Invoice not found or cannot be updated");
		}

		// 2. Delete existing lines
		await tx.delete(invoiceLine).where(eq(invoiceLine.invoiceId, invoiceId));

		// 3. Create new lines
		if (linesData.length > 0) {
			await tx.insert(invoiceLine).values(
				linesData.map((line) => ({
					invoiceId: updatedInvoice.id,
					accountId: line.accountId,
					description: line.description,
					quantity: line.quantity.toString(),
					unitPrice: line.unitPrice.toString(),
					taxRate: (line.taxRate || 0).toString(),
					taxAmount: line.taxAmount.toString(),
					totalAmount: line.totalAmount.toString(),
					updatedBy: data.updatedBy,
				})),
			);
		}

		return updatedInvoice;
	});
}

export async function approveInvoice(
	organizationId: string,
	invoiceId: string,
	userId?: string,
) {
	return await db.transaction(async (tx: TransactionDb) => {
		const [approvedInvoice] = await tx
			.update(invoice)
			.set({
				status: "sent",
				sentAt: new Date(),
				updatedBy: userId,
			})
			.where(
				and(
					eq(invoice.id, invoiceId),
					eq(invoice.organizationId, organizationId),
					eq(invoice.status, "draft"),
				),
			)
			.returning();

		if (!approvedInvoice) {
			throw new Error("Invoice not found or already approved");
		}

		return approvedInvoice;
	});
}

/**
 * ---------------------------------------------------------------------------
 * UNIFIED PAYMENT OPERATIONS
 * ---------------------------------------------------------------------------
 */

export async function recordPayment(
	organizationId: string,
	data: {
		paymentType: "received" | "sent";
		customerId?: string;
		supplierId?: string;
		amount: number;
		paymentDate: Date;
		paymentMethod: "bank_transfer" | "check" | "cash" | "card" | "online";
		referenceNumber?: string;
		bankAccountId?: string;
		allocations: {
			invoiceId: string;
			amount: number;
		}[];
		createdBy?: string;
	},
) {
	return await db.transaction(async (tx: TransactionDb) => {
		// 1. Create Payment Record
		const [newPayment] = await tx
			.insert(payment)
			.values({
				organizationId,
				paymentType: data.paymentType,
				partyType: data.paymentType === "received" ? "customer" : "supplier",
				customerId: data.customerId,
				supplierId: data.supplierId,
				paymentNumber: `PAY-${Date.now()}`,
				paymentDate: data.paymentDate,
				amount: data.amount.toString(),
				paymentMethod: data.paymentMethod,
				referenceNumber: data.referenceNumber,
				bankAccountId: data.bankAccountId,
				status: "cleared",
				createdBy: data.createdBy,
			})
			.returning();

		// 2. Create Allocations
		if (data.allocations.length > 0) {
			await tx.insert(paymentAllocation).values(
				data.allocations.map((alloc) => ({
					paymentId: newPayment.id,
					invoiceId: alloc.invoiceId,
					allocatedAmount: alloc.amount.toString(),
					createdBy: data.createdBy,
				})),
			);

			// 3. Update Invoice Payment Status
			for (const alloc of data.allocations) {
				const invoiceRecord = await tx.query.invoice.findFirst({
					where: eq(invoice.id, alloc.invoiceId),
					with: {
						allocations: true,
					},
				});

				if (invoiceRecord) {
					const totalPaid =
						invoiceRecord.allocations.reduce(
							(sum: number, a) => sum + Number(a.allocatedAmount),
							0,
						) + alloc.amount;
					const isPaid = totalPaid >= Number(invoiceRecord.totalAmount);

					await tx
						.update(invoice)
						.set({
							status: isPaid ? "paid" : invoiceRecord.status,
						})
						.where(eq(invoice.id, alloc.invoiceId));
				}
			}
		}

		return newPayment;
	});
}

/**
 * ---------------------------------------------------------------------------
 * QUERY OPERATIONS
 * ---------------------------------------------------------------------------
 */

export async function getPartyBalance(
	organizationId: string,
	partyId: string,
	partyType: "customer" | "supplier",
) {
	const invoices = await db
		.select({
			total: sql<string>`sum(${invoice.totalAmount})`,
		})
		.from(invoice)
		.where(
			and(
				eq(invoice.organizationId, organizationId),
				partyType === "customer"
					? eq(invoice.customerId, partyId)
					: eq(invoice.supplierId, partyId),
				sql`${invoice.status} != 'paid'`,
			),
		);

	return invoices[0]?.total || "0";
}

export async function getInvoices(
	organizationId: string,
	options?: {
		invoiceType?: "receivable" | "payable";
		limit?: number;
	},
) {
	const { invoiceType, limit = 50 } = options || {};

	return await db.query.invoice.findMany({
		where: and(
			eq(invoice.organizationId, organizationId),
			invoiceType ? eq(invoice.invoiceType, invoiceType) : undefined,
		),
		orderBy: [desc(invoice.invoiceDate)],
		with: {
			lines: true,
		},
		limit,
	});
}

export async function getInvoice(organizationId: string, invoiceId: string) {
	return await db.query.invoice.findFirst({
		where: and(
			eq(invoice.organizationId, organizationId),
			eq(invoice.id, invoiceId),
		),
		with: {
			lines: true,
			allocations: true,
		},
	});
}

export async function getPayments(
	organizationId: string,
	options?: {
		paymentType?: "received" | "sent";
		limit?: number;
	},
) {
	const { paymentType, limit = 50 } = options || {};

	return await db.query.payment.findMany({
		where: and(
			eq(payment.organizationId, organizationId),
			paymentType ? eq(payment.paymentType, paymentType) : undefined,
		),
		orderBy: [desc(payment.paymentDate)],
		with: {
			allocations: true,
		},
		limit,
	});
}
