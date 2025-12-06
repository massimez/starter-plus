import { Separator } from "@workspace/ui/components/separator";

export default function FinancialBankingPage() {
	return (
		<div className="space-y-6">
			<div>
				<h3 className="font-medium text-lg">Banking</h3>
				<p className="text-muted-foreground text-sm">
					Manage bank accounts and reconciliation.
				</p>
			</div>
			<Separator />
			{/* Banking Dashboard will go here */}
		</div>
	);
}
