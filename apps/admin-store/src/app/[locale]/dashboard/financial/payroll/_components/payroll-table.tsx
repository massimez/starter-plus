"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { DeleteConfirmationDialog } from "@workspace/ui/components/delete-confirmation-dialog";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { CalendarDays, Trash2 } from "lucide-react";
import { useFinancialPayroll } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-payroll";
import { useCurrency } from "@/app/providers/currency-provider";
import { formatDate } from "@/lib/date";
import { PayrollRunDetails } from "./payroll-run-details";

export function PayrollTable() {
	const { usePayrollRuns, useDeletePayrollRun } = useFinancialPayroll();
	const { data: runs, isLoading } = usePayrollRuns();
	const deletePayrollRun = useDeletePayrollRun();
	const { formatCurrency } = useCurrency();

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>
		);
	}

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Period</TableHead>
						<TableHead>Payment Date</TableHead>
						<TableHead>Total Gross</TableHead>
						<TableHead>Total Net</TableHead>
						<TableHead>Status</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{runs?.map((run) => (
						<TableRow key={run.id}>
							<TableCell>
								{formatDate(run.payrollPeriodStart)} -{" "}
								{formatDate(run.payrollPeriodEnd)}
							</TableCell>
							<TableCell>{formatDate(run.paymentDate)}</TableCell>
							<TableCell>
								{formatCurrency(Number(run.totalGross || 0))}
							</TableCell>
							<TableCell>{formatCurrency(Number(run.totalNet || 0))}</TableCell>
							<TableCell>
								<Badge
									variant={
										run.status === "paid"
											? "success"
											: run.status === "approved"
												? "secondary"
												: run.status === "draft"
													? "outline"
													: "secondary"
									}
									className="capitalize"
								>
									{run.status}
								</Badge>
							</TableCell>
							<TableCell className="text-right">
								<div className="flex items-center justify-end gap-2">
									<PayrollRunDetails payrollRun={run} />
									{run.status === "draft" && (
										<DeleteConfirmationDialog
											title="Delete Payroll Run?"
											description="This action cannot be undone. This will permanently delete the payroll run and all associated data."
											onConfirm={() => deletePayrollRun.mutate(run.id)}
											disabled={deletePayrollRun.isPending}
										>
											<Button
												variant="ghost"
												size="icon"
												className="text-destructive hover:text-destructive"
												disabled={deletePayrollRun.isPending}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</DeleteConfirmationDialog>
									)}
								</div>
							</TableCell>
						</TableRow>
					))}
					{!runs?.length && (
						<TableRow>
							<TableCell colSpan={6} className="h-32 text-center">
								<div className="flex flex-col items-center gap-2">
									<CalendarDays className="h-8 w-8 text-muted-foreground" />
									<p className="text-muted-foreground">
										No payroll runs found.
									</p>
									<p className="text-muted-foreground text-sm">
										Create a new payroll run to start processing salaries.
									</p>
								</div>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
