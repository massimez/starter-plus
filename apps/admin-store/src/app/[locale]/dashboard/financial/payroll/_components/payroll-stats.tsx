"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { CalendarCheck, Clock, DollarSign, Users } from "lucide-react";
import { useFinancialPayroll } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-payroll";
import { useCurrency } from "@/app/providers/currency-provider";

export function PayrollStats() {
	const { usePayrollRuns, useEmployees } = useFinancialPayroll();
	const { data: runs, isLoading: runsLoading } = usePayrollRuns();
	const { data: employees, isLoading: employeesLoading } = useEmployees();

	const isLoading = runsLoading || employeesLoading;

	const activeEmployees =
		employees?.filter((e: { status: string }) => e.status === "active")
			.length ?? 0;
	const pendingRuns =
		runs?.filter(
			(r: { status: string }) =>
				r.status === "draft" || r.status === "calculated",
		).length ?? 0;
	const paidRuns =
		runs?.filter((r: { status: string }) => r.status === "paid").length ?? 0;

	// Get latest paid or approved run for monthly payroll total
	const latestRun = runs?.find(
		(r: { status: string }) => r.status === "paid" || r.status === "approved",
	) as { totalNet?: string | null } | undefined;
	const monthlyPayroll = latestRun?.totalNet ? Number(latestRun.totalNet) : 0;

	const { formatCurrency } = useCurrency();

	if (isLoading) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{["skeleton-1", "skeleton-2", "skeleton-3", "skeleton-4"].map((key) => (
					<Card key={key}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-4 rounded" />
						</CardHeader>
						<CardContent>
							<Skeleton className="mb-1 h-8 w-16" />
							<Skeleton className="h-3 w-32" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card className="border-l-4 border-l-blue-500">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">
						Active Employees
					</CardTitle>
					<Users className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{activeEmployees}</div>
					<p className="text-muted-foreground text-xs">On payroll</p>
				</CardContent>
			</Card>

			<Card className="border-l-4 border-l-amber-500">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Pending Runs</CardTitle>
					<Clock className="h-4 w-4 text-amber-600" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{pendingRuns}</div>
					<p className="text-muted-foreground text-xs">
						Draft or awaiting approval
					</p>
				</CardContent>
			</Card>

			<Card className="border-l-4 border-l-green-500">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Completed Runs</CardTitle>
					<CalendarCheck className="h-4 w-4 text-green-600" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{paidRuns}</div>
					<p className="text-muted-foreground text-xs">Fully paid runs</p>
				</CardContent>
			</Card>

			<Card className="border-l-4 border-l-purple-500">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Latest Payroll</CardTitle>
					<DollarSign className="h-4 w-4 text-purple-600" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">
						{monthlyPayroll > 0 ? formatCurrency(monthlyPayroll) : "-"}
					</div>
					<p className="text-muted-foreground text-xs">
						Net amount (latest run)
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
