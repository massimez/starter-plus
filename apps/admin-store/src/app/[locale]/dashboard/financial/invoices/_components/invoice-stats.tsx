"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { AlertCircle, CheckCircle2, DollarSign, FileText } from "lucide-react";
import { useInvoiceStats } from "@/app/[locale]/dashboard/financial/_hooks/use-invoices";
import { useCurrency } from "@/app/providers/currency-provider";
import { formatCurrency } from "@/lib/helpers";

export function InvoiceStats() {
	const { data: stats, isLoading } = useInvoiceStats("receivable");
	const { currency } = useCurrency();

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

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card className="border-l-4 border-l-blue-500">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Total Invoices</CardTitle>
					<FileText className="h-4 w-4 text-blue-600" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{stats?.totalCount ?? 0}</div>
					<p className="text-muted-foreground text-xs">All customer invoices</p>
				</CardContent>
			</Card>

			<Card className="border-l-4 border-l-green-500">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Receivables</CardTitle>
					<DollarSign className="h-4 w-4 text-green-600" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">
						{formatCurrency(stats?.totalUnpaidAmount ?? 0, currency)}
					</div>
					<p className="text-muted-foreground text-xs">
						{stats?.unpaidCount ?? 0} unpaid invoices
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
						{formatCurrency(stats?.totalOverdueAmount ?? 0, currency)}
					</div>
					<p className="text-muted-foreground text-xs">
						{stats?.overdueCount ?? 0} overdue invoices
					</p>
				</CardContent>
			</Card>

			<Card className="border-l-4 border-l-gray-500">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Drafts</CardTitle>
					<CheckCircle2 className="h-4 w-4 text-gray-600" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{stats?.draftCount ?? 0}</div>
					<p className="text-muted-foreground text-xs">Invoices in draft</p>
				</CardContent>
			</Card>
		</div>
	);
}
