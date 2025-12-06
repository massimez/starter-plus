import { Separator } from "@workspace/ui/components/separator";
import { TransactionSheet } from "./_components/transaction-sheet";
import { TransactionsTable } from "./_components/transactions-table";

export default function FinancialTransactionsPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-medium text-lg">Transactions</h3>
					<p className="text-muted-foreground text-sm">
						Manage and view all financial transactions.
					</p>
				</div>
				<TransactionSheet />
			</div>
			<Separator />
			<TransactionsTable />
		</div>
	);
}
