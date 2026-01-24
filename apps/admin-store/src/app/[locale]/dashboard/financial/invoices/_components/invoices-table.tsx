"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import {
	CheckCheck,
	Copy,
	DollarSign,
	Edit,
	MoreHorizontal,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	useApproveInvoice,
	useDeleteInvoice,
} from "@/app/[locale]/dashboard/financial/_hooks/use-invoices";
import { formatDate } from "@/lib/date";
import { RecordPaymentDialog } from "../../_components/record-payment-dialog";
import { CreateInvoiceSheet } from "./create-invoice-sheet";

export interface Invoice {
	id: string;
	customerId?: string;
	invoiceNumber: string;
	invoiceDate: string;
	dueDate: string;
	totalAmount: string;
	netAmount: string;
	status: "draft" | "sent" | "paid" | "partial" | "overdue" | "cancelled";
	customer?: {
		firstName?: string | null;
		lastName?: string | null;
	};
}

interface InvoicesTableProps {
	data: Invoice[];
	isLoading: boolean;
}

export function InvoicesTable({
	data: invoices,
	isLoading,
}: InvoicesTableProps) {
	const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
	const [editOpen, setEditOpen] = useState(false);
	const [paymentOpen, setPaymentOpen] = useState(false);

	const deleteInvoice = useDeleteInvoice();
	const approveInvoice = useApproveInvoice();

	const handleDelete = (id: string) => {
		toast.promise(deleteInvoice.mutateAsync(id), {
			loading: "Deleting invoice...",
			success: "Invoice deleted successfully",
			error: "Failed to delete invoice",
		});
	};

	const handleApprove = (id: string) => {
		toast.promise(approveInvoice.mutateAsync(id), {
			loading: "Approving invoice...",
			success: "Invoice approved successfully",
			error: "Failed to approve invoice",
		});
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Invoices</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-full" />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>Invoices</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Invoice #</TableHead>
								<TableHead>Date</TableHead>
								<TableHead>Customer</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Payment</TableHead>
								<TableHead className="text-right">Amount</TableHead>
								<TableHead className="w-[50px]" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{(invoices as Invoice[])?.map((invoice) => (
								<TableRow key={invoice.id}>
									<TableCell className="font-medium">
										{invoice.invoiceNumber}
									</TableCell>
									<TableCell>
										{formatDate(invoice.invoiceDate, "MMM dd, yyyy")}
									</TableCell>
									<TableCell>
										{[invoice.customer?.firstName, invoice.customer?.lastName]
											.filter(Boolean)
											.join(" ") || "Unknown Customer"}
									</TableCell>
									<TableCell>
										<Badge variant="outline" className="capitalize">
											{invoice.status}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge
											variant={
												invoice.status === "paid"
													? "success"
													: invoice.status === "partial"
														? "warning"
														: "secondary"
											}
											className="capitalize"
										>
											{invoice.status}
										</Badge>
									</TableCell>
									<TableCell className="text-right font-medium">
										${Number(invoice.totalAmount).toFixed(2)}
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" className="h-8 w-8 p-0">
													<span className="sr-only">Open menu</span>
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuLabel>Actions</DropdownMenuLabel>
												<DropdownMenuItem
													onClick={() => {
														navigator.clipboard.writeText(invoice.id);
														toast.success("Invoice ID copied");
													}}
												>
													<Copy className="mr-2 h-4 w-4" />
													Copy ID
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												{invoice.status === "draft" && (
													<>
														<DropdownMenuItem
															onClick={() => {
																setSelectedInvoice(invoice);
																setEditOpen(true);
															}}
														>
															<Edit className="mr-2 h-4 w-4" />
															Edit
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => handleApprove(invoice.id)}
														>
															<CheckCheck className="mr-2 h-4 w-4" />
															Approve
														</DropdownMenuItem>
														<DropdownMenuItem
															className="text-destructive focus:text-destructive"
															onClick={() => handleDelete(invoice.id)}
														>
															<Trash2 className="mr-2 h-4 w-4" />
															Delete
														</DropdownMenuItem>
													</>
												)}
												{invoice.status !== "paid" &&
													invoice.status !== "draft" && (
														<DropdownMenuItem
															onClick={() => {
																setSelectedInvoice(invoice);
																setPaymentOpen(true);
															}}
														>
															<DollarSign className="mr-2 h-4 w-4" />
															Record Payment
														</DropdownMenuItem>
													)}
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
							{invoices?.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={7}
										className="h-24 text-center text-muted-foreground"
									>
										No invoices found.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{selectedInvoice && (
				<>
					<CreateInvoiceSheet
						key={selectedInvoice.id}
						invoiceId={selectedInvoice.id}
						open={editOpen}
						onOpenChange={(open) => {
							setEditOpen(open);
							if (!open) setSelectedInvoice(null);
						}}
					/>

					{paymentOpen && selectedInvoice && (
						<RecordPaymentDialog
							open={paymentOpen}
							onOpenChange={(open) => {
								setPaymentOpen(open);
								if (!open) setSelectedInvoice(null);
							}}
							type="receivable"
							document={selectedInvoice}
						/>
					)}
				</>
			)}
		</>
	);
}
