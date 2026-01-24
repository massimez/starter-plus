import { Separator } from "@workspace/ui/components/separator";
import { DashboardStats } from "./_components/dashboard-stats";
import { RecentTransactions } from "./_components/recent-transactions";

export default function FinancialOverviewPage() {
	return (
		<div className="space-y-6">
			<div>
				<h3 className="font-medium text-lg">Financial Overview</h3>
				<p className="text-muted-foreground text-sm">
					High-level metrics and recent activity.
				</p>
			</div>
			<Separator />
			<DashboardStats />
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<RecentTransactions />
			</div>
		</div>
	);
}
