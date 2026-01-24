"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { cn } from "@workspace/ui/lib/utils";
import { FileText } from "lucide-react";
import { useState } from "react";
import { useFinancialAccounting } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-accounting";
import { formatDate } from "@/lib/date";

export function TrialBalanceReport() {
	const [asOfDate, setAsOfDate] = useState<Date>(new Date());
	const { useTrialBalance } = useFinancialAccounting();
	const { data: balances, isLoading } = useTrialBalance(asOfDate);

	const totalDebits = balances?.reduce(
		(sum, b) => sum + Number(b.totalDebit),
		0,
	);
	const totalCredits = balances?.reduce(
		(sum, b) => sum + Number(b.totalCredit),
		0,
	);

	const isBalanced = totalDebits === totalCredits;

	const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.value) {
			setAsOfDate(new Date(e.target.value));
		}
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Trial Balance</CardTitle>
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
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Trial Balance</CardTitle>
						<CardDescription>
							As of {formatDate(asOfDate, "PPP")}
						</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<Label htmlFor="asOf" className="text-muted-foreground text-sm">
							As of:
						</Label>
						<Input
							id="asOf"
							type="date"
							value={formatDate(asOfDate, "yyyy-MM-dd")}
							onChange={handleDateChange}
							className="w-[180px]"
						/>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[120px]">Account Code</TableHead>
							<TableHead>Account Name</TableHead>
							<TableHead className="text-right">Debit</TableHead>
							<TableHead className="text-right">Credit</TableHead>
							<TableHead className="text-right">Net Balance</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{balances && balances.length > 0 ? (
							balances.map((balance) => (
								<TableRow key={balance.accountId}>
									<TableCell className="font-medium font-mono">
										{balance.accountCode}
									</TableCell>
									<TableCell className="font-medium">
										{balance.accountName}
									</TableCell>
									<TableCell className="text-right font-mono">
										{Number(balance.totalDebit) > 0
											? Number(balance.totalDebit).toLocaleString("en-US", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})
											: "-"}
									</TableCell>
									<TableCell className="text-right font-mono">
										{Number(balance.totalCredit) > 0
											? Number(balance.totalCredit).toLocaleString("en-US", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})
											: "-"}
									</TableCell>
									<TableCell
										className={cn(
											"text-right font-medium font-mono",
											balance.netBalance > 0 && "text-blue-600",
											balance.netBalance < 0 && "text-red-600",
										)}
									>
										{balance.netBalance.toLocaleString("en-US", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={5} className="h-32 text-center">
									<div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
										<FileText className="h-8 w-8" />
										<p className="font-medium">No transactions found</p>
										<p className="text-sm">
											Post journal entries to see balances
										</p>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
					{balances && balances.length > 0 && (
						<TableFooter>
							<TableRow className="font-bold">
								<TableCell colSpan={2}>Total</TableCell>
								<TableCell className="text-right font-mono">
									{totalDebits?.toLocaleString("en-US", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</TableCell>
								<TableCell className="text-right font-mono">
									{totalCredits?.toLocaleString("en-US", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</TableCell>
								<TableCell
									className={cn(
										"text-right font-mono",
										isBalanced ? "text-green-600" : "text-red-600",
									)}
								>
									{isBalanced ? "✓ Balanced" : "⚠ Out of Balance"}
								</TableCell>
							</TableRow>
						</TableFooter>
					)}
				</Table>
			</CardContent>
		</Card>
	);
}
