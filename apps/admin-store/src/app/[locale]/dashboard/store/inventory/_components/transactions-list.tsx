"use client";

import { Card, CardContent, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { Receipt } from "lucide-react";
import { useState } from "react";
import { useInventoryTransactions } from "../hooks/use-inventory";

interface TransactionsListProps {
	productVariantId?: string;
}

export const TransactionsList = ({
	productVariantId,
}: TransactionsListProps) => {
	const [searchTerm, setSearchTerm] = useState("");

	const {
		data: transactionsResponse,
		isLoading,
		error,
	} = useInventoryTransactions(productVariantId || "");

	const transactions = transactionsResponse?.data || [];

	const filteredTransactions = transactions.filter(
		(transaction) =>
			transaction.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
			transaction.referenceId?.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	if (isLoading) return <div>Loading transactions...</div>;
	if (error) return <div>Error loading transactions: {error.message}</div>;

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4">
				<Input
					placeholder="Search transactions by reason, ID, or reference..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="max-w-md"
				/>
				<p className="whitespace-nowrap text-muted-foreground text-sm">
					{filteredTransactions.length}{" "}
					{filteredTransactions.length === 1 ? "transaction" : "transactions"}
				</p>
			</div>

			{filteredTransactions.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12 text-center">
						<Receipt className="mb-4 h-12 w-12 text-muted-foreground" />
						<CardTitle className="mb-2">No transactions found</CardTitle>
						<p className="text-muted-foreground text-sm">
							{searchTerm
								? "Try adjusting your search terms"
								: "No transactions exist for this variant"}
						</p>
					</CardContent>
				</Card>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>SKU</TableHead>
							<TableHead>Reason</TableHead>
							<TableHead>Quantity Change</TableHead>
							<TableHead>Location</TableHead>
							<TableHead>Unit Cost</TableHead>
							<TableHead>Reference</TableHead>
							<TableHead>Date</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredTransactions.map((transaction) => (
							<TableRow key={transaction.id}>
								<TableCell>{transaction.variant?.sku || "N/A"}</TableCell>
								<TableCell className="font-medium">
									{transaction.reason?.replace("_", " ") || "N/A"}
								</TableCell>
								<TableCell>
									<span
										className={
											transaction.quantityChange > 0
												? "text-green-600"
												: "text-red-600"
										}
									>
										{transaction.quantityChange > 0 ? "+" : ""}
										{transaction.quantityChange}
									</span>
								</TableCell>
								<TableCell>{transaction.location.name || "N/A"}</TableCell>
								<TableCell>
									{Number.parseInt(transaction.unitCost || "0", 10).toFixed(2)}
								</TableCell>
								<TableCell>{transaction.referenceId || "-"}</TableCell>
								<TableCell>
									{transaction.createdAt
										? new Date(transaction.createdAt).toLocaleDateString()
										: "Unknown"}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
};
