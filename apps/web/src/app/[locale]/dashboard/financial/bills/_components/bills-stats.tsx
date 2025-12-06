"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { AlertCircle, CheckCircle2, DollarSign, FileText } from "lucide-react";
import { useSupplierInvoices } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-bills";

export function BillsStats() {
	const { data: bills, isLoading } = useSupplierInvoices(100);

	if (isLoading) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{[...Array(4)].map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: <>
					<Card key={i}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-4 rounded" />
						</CardHeader>
						<CardContent>
							<Skeleton className="mb-1 h-8 w-16" />
							<Skeleton className="h-3 w-32" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	const totalBills = bills?.length ?? 0;

	const unpaidBills =
		bills?.filter(
			(b) =>
				b.paymentStatus === "unpaid" || b.paymentStatus === "partially_paid",
		) || [];

	const totalUnpaidAmount = unpaidBills.reduce(
		(sum, b) => sum + Number(b.netAmount || b.totalAmount), // Use netAmount if available, or totalAmount
		0,
	);

	const overdueBills =
		bills?.filter((b) => {
			const isUnpaid = b.paymentStatus !== "paid";
			const isOverdue = new Date(b.dueDate) < new Date();
			return isUnpaid && isOverdue;
		}) || [];

	const totalOverdueAmount = overdueBills.reduce(
		(sum, b) => sum + Number(b.netAmount || b.totalAmount),
		0,
	);

	const draftBills = bills?.filter((b) => b.status === "draft").length ?? 0;

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card className="border-l-4 border-l-blue-500">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Total Bills</CardTitle>
					<FileText className="h-4 w-4 text-blue-600" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{totalBills}</div>
					<p className="text-muted-foreground text-xs">All vendor bills</p>
				</CardContent>
			</Card>

			<Card className="border-l-4 border-l-amber-500">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Unpaid Amount</CardTitle>
					<DollarSign className="h-4 w-4 text-amber-600" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">
						{new Intl.NumberFormat("en-US", {
							style: "currency",
							currency: "USD",
						}).format(totalUnpaidAmount)}
					</div>
					<p className="text-muted-foreground text-xs">
						{unpaidBills.length} unpaid bills
					</p>
				</CardContent>
			</Card>

			<Card className="border-l-4 border-l-red-500">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Overdue</CardTitle>
					<AlertCircle className="h-4 w-4 text-red-600" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">
						{new Intl.NumberFormat("en-US", {
							style: "currency",
							currency: "USD",
						}).format(totalOverdueAmount)}
					</div>
					<p className="text-muted-foreground text-xs">
						{overdueBills.length} overdue bills
					</p>
				</CardContent>
			</Card>

			<Card className="border-l-4 border-l-gray-500">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Drafts</CardTitle>
					<CheckCircle2 className="h-4 w-4 text-gray-600" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{draftBills}</div>
					<p className="text-muted-foreground text-xs">Bills in draft</p>
				</CardContent>
			</Card>
		</div>
	);
}
