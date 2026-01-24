import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

const recentTransactions = [
	{
		id: "TRX-9871",
		date: "2023-10-25",
		description: "Payment from Client X",
		amount: 1250.0,
		type: "income",
		status: "completed",
	},
	{
		id: "TRX-9872",
		date: "2023-10-24",
		description: "Office Supplies",
		amount: -120.5,
		type: "expense",
		status: "completed",
	},
	{
		id: "TRX-9873",
		date: "2023-10-24",
		description: "Software Subscription",
		amount: -49.99,
		type: "expense",
		status: "pending",
	},
	{
		id: "TRX-9874",
		date: "2023-10-23",
		description: "Consulting Services",
		amount: 3500.0,
		type: "income",
		status: "completed",
	},
	{
		id: "TRX-9875",
		date: "2023-10-22",
		description: "Utility Bill",
		amount: -230.0,
		type: "expense",
		status: "completed",
	},
];

export function RecentTransactions() {
	return (
		<Card className="col-span-4 lg:col-span-3">
			<CardHeader className="flex flex-row items-center">
				<div className="grid gap-2">
					<CardTitle>Recent Transactions</CardTitle>
					<CardDescription>Latest financial movements.</CardDescription>
				</div>
				<Button asChild size="sm" className="ml-auto gap-1">
					<Link href="/dashboard/financial/transactions">
						View All
						<ArrowUpRight className="h-4 w-4" />
					</Link>
				</Button>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Date</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Amount</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{recentTransactions.map((transaction) => (
							<TableRow key={transaction.id}>
								<TableCell>{transaction.date}</TableCell>
								<TableCell>
									<div className="font-medium">{transaction.description}</div>
									<div className="hidden text-muted-foreground text-xs md:inline">
										{transaction.id}
									</div>
								</TableCell>
								<TableCell>
									<Badge
										variant={
											transaction.status === "completed"
												? "success"
												: "secondary"
										}
										className="capitalize"
									>
										{transaction.status}
									</Badge>
								</TableCell>
								<TableCell
									className={`text-right font-medium ${transaction.type === "income" ? "text-green-600" : ""}`}
								>
									{transaction.type === "income" ? "+" : ""}$
									{Math.abs(transaction.amount).toFixed(2)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
