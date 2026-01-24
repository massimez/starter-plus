import { Separator } from "@workspace/ui/components/separator";
import { FinancialList } from "../_components/financial-list";
import { CreateInvoiceSheet } from "./_components/create-invoice-sheet";
import { InvoiceStats } from "./_components/invoice-stats";
import { InvoicesTable } from "./_components/invoices-table";

export default function FinancialInvoicesPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-medium text-lg">Invoices</h3>
					<p className="text-muted-foreground text-sm">
						Manage customer invoices and receivables.
					</p>
				</div>
				<CreateInvoiceSheet />
			</div>
			<Separator />
			<InvoiceStats />
			<FinancialList type="receivable" table={InvoicesTable} />
		</div>
	);
}
