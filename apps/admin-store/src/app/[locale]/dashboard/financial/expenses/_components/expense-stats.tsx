"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { CheckCircle2, Clock, DollarSign, Receipt } from "lucide-react";
import { useFinancialExpenses } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-expenses";
import { useCurrency } from "@/app/providers/currency-provider";

type Expense = {
	status: "pending" | "approved" | "rejected" | "paid";
	amount: string;
};

export function ExpenseStats() {
	// Fetch a larger number for stats to be more accurate
	const { data: expenses, isLoading } = useFinancialExpenses({ limit: "100" });
	const { formatCurrency } = useCurrency();

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

	const expensesList = (Array.isArray(expenses)
		? expenses
		: []) as unknown as Expense[];

	const totalExpenses = expensesList.length;
	const pendingExpenses = expensesList.filter(
		(e) => e.status === "pending",
	).length;
	const approvedExpenses = expensesList.filter(
		(e) => e.status === "approved" || e.status === "paid",
	).length;

	const pendingAmount = expensesList
		.filter((e) => e.status === "pending")
		.reduce((acc, curr) => acc + Number(curr.amount), 0);

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card className="border-l-4 border-l-blue-500">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Total Expenses</CardTitle>
					<Receipt className="h-4 w-4 text-blue-600" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{totalExpenses}</div>
					<p className="text-muted-foreground text-xs">All recorded expenses</p>
				</CardContent>
			</Card>

			<Card className="border-l-4 border-l-amber-500">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Pending Review</CardTitle>
					<Clock className="h-4 w-4 text-amber-600" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{pendingExpenses}</div>
					<p className="text-muted-foreground text-xs">Awaiting approval</p>
				</CardContent>
			</Card>

			<Card className="border-l-4 border-l-green-500">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Approved</CardTitle>
					<CheckCircle2 className="h-4 w-4 text-green-600" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{approvedExpenses}</div>
					<p className="text-muted-foreground text-xs">
						Ready for payment or paid
					</p>
				</CardContent>
			</Card>

			<Card className="border-l-4 border-l-purple-500">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Pending Amount</CardTitle>
					<DollarSign className="h-4 w-4 text-purple-600" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">
						{formatCurrency(pendingAmount)}
					</div>
					<p className="text-muted-foreground text-xs">Total pending value</p>
				</CardContent>
			</Card>
		</div>
	);
}
