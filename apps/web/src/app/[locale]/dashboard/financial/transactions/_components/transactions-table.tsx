"use client";

import { Badge } from "@workspace/ui/components/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
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
import { useFinancialTransactions } from "@/app/[locale]/dashboard/financial/_hooks/use-financial";

interface FinancialTransaction {
	id: string;
	transactionDate: string;
	type: "bank" | "receivable" | "payable" | "expense" | "payroll" | "payout";
	transactionType: string;
	description: string;
	amount: string;
	reconciliationStatus: string;
	referenceNumber: string;
	payeePayer: string;
	bankAccount: {
		bankName: string;
		accountName: string;
	} | null;
}

export function TransactionsTable() {
	const { data: transactions, isLoading } = useFinancialTransactions(100);

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>All Transactions</CardTitle>
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
		<Card>
			<CardHeader>
				<CardTitle>All Transactions</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Date</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Account</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Amount</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{(transactions?.data as FinancialTransaction[])?.map(
							(transaction) => (
								<TableRow key={transaction.id}>
									<TableCell>
										{format(
											new Date(transaction.transactionDate),
											"MMM dd, yyyy",
										)}
									</TableCell>
									<TableCell>
										<div className="font-medium">{transaction.description}</div>
										<div className="text-muted-foreground text-xs">
											{transaction.payeePayer}
										</div>
									</TableCell>
									<TableCell>
										{transaction.bankAccount
											? `${transaction.bankAccount.bankName} - ${transaction.bankAccount.accountName}`
											: transaction.type === "receivable"
												? "Receivables"
												: transaction.type === "payable"
													? "Payables (Bills)"
													: transaction.type === "expense"
														? "Expenses"
														: transaction.type === "payroll"
															? "Payroll"
															: transaction.type === "payout"
																? "Payouts"
																: "N/A"}
									</TableCell>
									<TableCell className="capitalize">
										{transaction.transactionType}
									</TableCell>
									<TableCell>
										<Badge
											variant={
												transaction.reconciliationStatus === "reconciled"
													? "success"
													: "secondary"
											}
											className="capitalize"
										>
											{transaction.reconciliationStatus}
										</Badge>
									</TableCell>
									<TableCell
										className={`text-right font-medium ${
											["deposit", "interest"].includes(
												transaction.transactionType,
											)
												? "text-green-600"
												: ""
										}`}
									>
										{["deposit", "interest"].includes(
											transaction.transactionType,
										)
											? "+"
											: "-"}
										${Number(transaction.amount).toFixed(2)}
									</TableCell>
								</TableRow>
							),
						)}
						{transactions?.data?.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={6}
									className="h-24 text-center text-muted-foreground"
								>
									No transactions found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
