import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	supplierInvoice,
	supplierInvoiceLine,
	supplierPayment,
	supplierPaymentAllocation,
} from "@/lib/db/schema/financial/payables";
import type { TransactionDb } from "@/types/db";

/**
 * ---------------------------------------------------------------------------
 * SUPPLIER INVOICE OPERATIONS
 * ---------------------------------------------------------------------------
 */

export async function createSupplierInvoice(
	organizationId: string,
	data: {
		supplierId: string;
		invoiceNumber: string;
		invoiceDate: Date;
		dueDate: Date;
		currency: string;
		items: {
			expenseAccountId: string;
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
			.insert(supplierInvoice)
			.values({
				organizationId,
				supplierId: data.supplierId,
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
			await tx.insert(supplierInvoiceLine).values(
				linesData.map((line) => ({
					supplierInvoiceId: invoice.id,
					expenseAccountId: line.expenseAccountId,
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

export async function updateSupplierInvoice(
	organizationId: string,
	invoiceId: string,
	data: {
		supplierId: string;
		invoiceNumber: string;
		invoiceDate: Date;
		dueDate: Date;
		currency: string;
		items: {
			expenseAccountId: string;
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
		// 1. Check if invoice exists and is draft
		const existingInvoice = await tx.query.supplierInvoice.findFirst({
			where: and(
				eq(supplierInvoice.id, invoiceId),
				eq(supplierInvoice.organizationId, organizationId),
			),
		});

		if (!existingInvoice) {
			throw new Error("Invoice not found");
		}

		if (existingInvoice.status !== "draft") {
			throw new Error("Only draft invoices can be updated");
		}

		// 2. Update Invoice Header
		const [invoice] = await tx
			.update(supplierInvoice)
			.set({
				supplierId: data.supplierId,
				invoiceNumber: data.invoiceNumber,
				invoiceDate: data.invoiceDate,
				dueDate: data.dueDate,
				currency: data.currency,
				totalAmount: totalAmount.toString(),
				taxAmount: totalTax.toString(),
				netAmount: (totalAmount - totalTax).toString(),
				updatedBy: data.updatedBy,
				updatedAt: new Date(),
			})
			.where(eq(supplierInvoice.id, invoiceId))
			.returning();

		// 3. Delete existing lines
		await tx
			.delete(supplierInvoiceLine)
			.where(eq(supplierInvoiceLine.supplierInvoiceId, invoiceId));

		// 4. Create new lines
		if (linesData.length > 0) {
			await tx.insert(supplierInvoiceLine).values(
				linesData.map((line) => ({
					supplierInvoiceId: invoice.id,
					expenseAccountId: line.expenseAccountId,
					description: line.description,
					quantity: line.quantity.toString(),
					unitPrice: line.unitPrice.toString(),
					taxRate: (line.taxRate || 0).toString(),
					taxAmount: line.taxAmount.toString(),
					totalAmount: line.totalAmount.toString(),
					createdBy: existingInvoice.createdBy, // Keep original creator
				})),
			);
		}

		return invoice;
	});
}

export async function approveSupplierInvoice(
	organizationId: string,
	invoiceId: string,
	userId: string,
) {
	return await db.transaction(async (tx: TransactionDb) => {
		// Update Invoice Status
		const [invoice] = await tx
			.update(supplierInvoice)
			.set({
				status: "approved",
				approvedBy: userId,
				approvedAt: new Date(),
			})
			.where(
				and(
					eq(supplierInvoice.id, invoiceId),
					eq(supplierInvoice.organizationId, organizationId),
					eq(supplierInvoice.status, "draft"),
				),
			)
			.returning();

		if (!invoice) {
			throw new Error("Invoice not found or already approved");
		}

		// TODO: Create Journal Entry (AP Accrual) when account configuration is ready

		return invoice;
	});
}

/**
 * ---------------------------------------------------------------------------
 * SUPPLIER PAYMENT OPERATIONS
 * ---------------------------------------------------------------------------
 */

export async function recordSupplierPayment(
	organizationId: string,
	data: {
		supplierId: string;
		amount: number;
		paymentDate: Date;
		paymentMethod: "bank_transfer" | "check" | "cash" | "card";
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
			.insert(supplierPayment)
			.values({
				organizationId,
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
			await tx.insert(supplierPaymentAllocation).values(
				data.allocations.map((alloc) => ({
					supplierPaymentId: payment.id,
					supplierInvoiceId: alloc.invoiceId,
					allocatedAmount: alloc.amount.toString(),
					createdBy: data.createdBy,
				})),
			);

			// 3. Update Invoice Payment Status
			for (const alloc of data.allocations) {
				const invoice = await tx.query.supplierInvoice.findFirst({
					where: eq(supplierInvoice.id, alloc.invoiceId),
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
						.update(supplierInvoice)
						.set({
							paymentStatus: isPaid ? "paid" : "partially_paid",
							status: isPaid ? "paid" : invoice.status,
						})
						.where(eq(supplierInvoice.id, alloc.invoiceId));
				}
			}
		}

		return payment;
	});
}

export async function getSupplierBalance(
	organizationId: string,
	supplierId: string,
) {
	const invoices = await db
		.select({
			total: sql<string>`sum(${supplierInvoice.totalAmount})`,
		})
		.from(supplierInvoice)
		.where(
			and(
				eq(supplierInvoice.organizationId, organizationId),
				eq(supplierInvoice.supplierId, supplierId),
				sql`${supplierInvoice.paymentStatus} != 'paid'`,
			),
		);

	return invoices[0]?.total || "0";
}

export async function getSupplierInvoices(organizationId: string, limit = 50) {
	return await db.query.supplierInvoice.findMany({
		where: eq(supplierInvoice.organizationId, organizationId),
		orderBy: [desc(supplierInvoice.invoiceDate)],
		limit,
		with: {
			supplier: true,
		},
	});
}

export async function getSupplierInvoice(
	organizationId: string,
	invoiceId: string,
) {
	return await db.query.supplierInvoice.findFirst({
		where: and(
			eq(supplierInvoice.organizationId, organizationId),
			eq(supplierInvoice.id, invoiceId),
		),
		with: {
			lines: true,
		},
	});
}
