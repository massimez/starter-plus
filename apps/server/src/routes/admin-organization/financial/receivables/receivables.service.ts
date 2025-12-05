import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	customerInvoice,
	customerInvoiceLine,
	customerPayment,
	customerPaymentAllocation,
} from "@/lib/db/schema/financial/receivables";
import type { TransactionDb } from "@/types/db";

/**
 * ---------------------------------------------------------------------------
 * CUSTOMER INVOICE OPERATIONS
 * ---------------------------------------------------------------------------
 */

export async function createCustomerInvoice(
	organizationId: string,
	data: {
		customerId: string;
		invoiceNumber: string;
		invoiceDate: Date;
		dueDate: Date;
		currency: string;
		items: {
			revenueAccountId: string;
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
		const [invoice] = await tx
			.insert(customerInvoice)
			.values({
				organizationId,
				customerId: data.customerId,
				invoiceNumber: data.invoiceNumber,
				invoiceDate: data.invoiceDate,
				dueDate: data.dueDate,
				currency: data.currency,
				totalAmount: totalAmount.toString(),
				taxAmount: totalTax.toString(),
				netAmount: (totalAmount - totalTax).toString(),
				status: "draft",
				paymentStatus: "unpaid",
				createdBy: data.createdBy,
			})
			.returning();

		// 2. Create Invoice Lines
		if (linesData.length > 0) {
			await tx.insert(customerInvoiceLine).values(
				linesData.map((line) => ({
					customerInvoiceId: invoice.id,
					revenueAccountId: line.revenueAccountId,
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

		return invoice;
	});
}

export async function approveCustomerInvoice(
	organizationId: string,
	invoiceId: string,
) {
	return await db.transaction(async (tx: TransactionDb) => {
		const [invoice] = await tx
			.update(customerInvoice)
			.set({
				status: "sent",
				sentAt: new Date(),
			})
			.where(
				and(
					eq(customerInvoice.id, invoiceId),
					eq(customerInvoice.organizationId, organizationId),
					eq(customerInvoice.status, "draft"),
				),
			)
			.returning();

		if (!invoice) {
			throw new Error("Invoice not found or already approved");
		}

		return invoice;
	});
}

/**
 * ---------------------------------------------------------------------------
 * CUSTOMER PAYMENT OPERATIONS
 * ---------------------------------------------------------------------------
 */

export async function recordCustomerPayment(
	organizationId: string,
	data: {
		customerId: string;
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
		const [payment] = await tx
			.insert(customerPayment)
			.values({
				organizationId,
				customerId: data.customerId,
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
			await tx.insert(customerPaymentAllocation).values(
				data.allocations.map((alloc) => ({
					customerPaymentId: payment.id,
					customerInvoiceId: alloc.invoiceId,
					allocatedAmount: alloc.amount.toString(),
					createdBy: data.createdBy,
				})),
			);

			// 3. Update Invoice Payment Status
			for (const alloc of data.allocations) {
				const invoice = await tx.query.customerInvoice.findFirst({
					where: eq(customerInvoice.id, alloc.invoiceId),
					with: {
						allocations: true,
					},
				});

				if (invoice) {
					const totalPaid =
						invoice.allocations.reduce(
							(sum: number, a) => sum + Number(a.allocatedAmount),
							0,
						) + alloc.amount;
					const isPaid = totalPaid >= Number(invoice.totalAmount);

					await tx
						.update(customerInvoice)
						.set({
							paymentStatus: isPaid ? "paid" : "partially_paid",
							status: isPaid ? "paid" : invoice.status,
						})
						.where(eq(customerInvoice.id, alloc.invoiceId));
				}
			}
		}

		return payment;
	});
}

export async function getCustomerBalance(
	organizationId: string,
	customerId: string,
) {
	const invoices = await db
		.select({
			total: sql<string>`sum(${customerInvoice.totalAmount})`,
		})
		.from(customerInvoice)
		.where(
			and(
				eq(customerInvoice.organizationId, organizationId),
				eq(customerInvoice.customerId, customerId),
				sql`${customerInvoice.paymentStatus} != 'paid'`,
			),
		);

	return invoices[0]?.total || "0";
}

export async function getCustomerInvoices(organizationId: string, limit = 50) {
	return await db.query.customerInvoice.findMany({
		where: eq(customerInvoice.organizationId, organizationId),
		orderBy: [desc(customerInvoice.invoiceDate)],
		with: {
			lines: true,
		},
		limit,
	});
}

export async function getCustomerInvoice(
	organizationId: string,
	invoiceId: string,
) {
	return await db.query.customerInvoice.findFirst({
		where: and(
			eq(customerInvoice.organizationId, organizationId),
			eq(customerInvoice.id, invoiceId),
		),
		with: {
			lines: true,
			allocations: true,
		},
	});
}
