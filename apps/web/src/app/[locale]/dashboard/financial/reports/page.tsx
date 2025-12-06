import { Separator } from "@workspace/ui/components/separator";

export default function FinancialReportsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h3 className="font-medium text-lg">Reports</h3>
				<p className="text-muted-foreground text-sm">
					Financial reports and analytics.
				</p>
			</div>
			<Separator />
			{/* Reports Dashboard will go here */}
		</div>
	);
}
