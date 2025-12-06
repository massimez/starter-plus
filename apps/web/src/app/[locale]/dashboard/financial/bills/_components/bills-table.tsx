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
import { format } from "date-fns";
import { Copy, DollarSign, Edit, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSupplierInvoices } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-bills";
import { CreateBillSheet } from "./create-bill-sheet";
import { RecordPaymentDialog } from "./record-payment-dialog";

interface Bill {
	id: string;
	supplierId: string;
	invoiceNumber: string;
	invoiceDate: string; // or Date, depending on what comes back. Usually string from JSON.
	dueDate: string;
	totalAmount: string;
	netAmount: string;
	status:
		| "draft"
		| "approved"
		| "paid"
		| "partially_paid"
		| "overdue"
		| "cancelled";
	paymentStatus: "unpaid" | "partially_paid" | "paid";
	supplier?: {
		name: string;
	};
}

export function BillsTable() {
	const { data: bills, isLoading } = useSupplierInvoices(50);
	const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
	const [editOpen, setEditOpen] = useState(false);
	const [paymentOpen, setPaymentOpen] = useState(false);

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Bills</CardTitle>
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
					<CardTitle>Bills</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Bill #</TableHead>
								<TableHead>Date</TableHead>
								<TableHead>Supplier</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Payment</TableHead>
								<TableHead className="text-right">Amount</TableHead>
								<TableHead className="w-[50px]" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{(bills as Bill[])?.map((bill) => (
								<TableRow key={bill.id}>
									<TableCell className="font-medium">
										{bill.invoiceNumber}
									</TableCell>
									<TableCell>
										{format(new Date(bill.invoiceDate), "MMM dd, yyyy")}
									</TableCell>
									<TableCell>
										{bill.supplier?.name || "Unknown Supplier"}
									</TableCell>
									<TableCell>
										<Badge variant="outline" className="capitalize">
											{bill.status}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge
											variant={
												bill.paymentStatus === "paid"
													? "success"
													: bill.paymentStatus === "partially_paid"
														? "warning"
														: "secondary"
											}
											className="capitalize"
										>
											{bill.paymentStatus?.replace("_", " ")}
										</Badge>
									</TableCell>
									<TableCell className="text-right font-medium">
										${Number(bill.totalAmount).toFixed(2)}
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
														navigator.clipboard.writeText(bill.id);
														toast.success("Bill ID copied");
													}}
												>
													<Copy className="mr-2 h-4 w-4" />
													Copy ID
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												{bill.status === "draft" && (
													<DropdownMenuItem
														onClick={() => {
															setSelectedBill(bill);
															setEditOpen(true);
														}}
													>
														<Edit className="mr-2 h-4 w-4" />
														Edit
													</DropdownMenuItem>
												)}
												{bill.paymentStatus !== "paid" && (
													<DropdownMenuItem
														onClick={() => {
															setSelectedBill(bill);
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
							{bills?.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={7}
										className="h-24 text-center text-muted-foreground"
									>
										No bills found.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{selectedBill && (
				<>
					<CreateBillSheet
						key={selectedBill.id} // Force re-render on change
						billId={selectedBill.id}
						open={editOpen}
						onOpenChange={(open) => {
							setEditOpen(open);
							if (!open) setSelectedBill(null);
						}}
					/>

					{paymentOpen && (
						<RecordPaymentDialog
							open={paymentOpen}
							onOpenChange={(open) => {
								setPaymentOpen(open);
								if (!open) setSelectedBill(null);
							}}
							bill={selectedBill}
						/>
					)}
				</>
			)}
		</>
	);
}
