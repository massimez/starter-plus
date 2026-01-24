import { Separator } from "@workspace/ui/components/separator";
import { FinancialList } from "../_components/financial-list";
import { BillsStats } from "./_components/bills-stats";
import { BillsTable } from "./_components/bills-table";
import { CreateBillSheet } from "./_components/create-bill-sheet";

export default function FinancialBillsPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-medium text-lg">Bills</h3>
					<p className="text-muted-foreground text-sm">
						Manage vendor bills and payables.
					</p>
				</div>
				<CreateBillSheet />
			</div>
			<Separator />
			<BillsStats />
			<FinancialList type="payable" table={BillsTable} />
		</div>
	);
}
