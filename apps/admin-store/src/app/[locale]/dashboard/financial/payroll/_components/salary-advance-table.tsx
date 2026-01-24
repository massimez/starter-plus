"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { useFinancialPayroll } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-payroll";

export function SalaryAdvanceTable() {
	const {
		useSalaryAdvances,
		useApproveSalaryAdvance,
		useDisburseSalaryAdvance,
	} = useFinancialPayroll();
	const { data: advances, isLoading } = useSalaryAdvances();
	const approveAdvance = useApproveSalaryAdvance();
	const disburseAdvance = useDisburseSalaryAdvance();

	const handleApprove = (id: string, requestedAmount: string) => {
		approveAdvance.mutate(
			{
				id,
				approvedAmount: Number(requestedAmount),
			},
			{
				onSuccess: () => {
					toast.success("Advance approved successfully");
				},
				onError: () => {
					toast.error("Failed to approve advance");
				},
			},
		);
	};

	if (isLoading) {
		return <div>Loading advances...</div>;
	}

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Employee</TableHead>
						<TableHead>Requested Amount</TableHead>
						<TableHead>Outstanding Balance</TableHead>
						<TableHead>Date</TableHead>
						<TableHead>Status</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{advances?.map((advance) => (
						<TableRow key={advance.id}>
							<TableCell>
								<div className="font-medium">
									{advance.employee.firstName} {advance.employee.lastName}
								</div>
								<div className="text-muted-foreground text-xs">
									{advance.employee.employeeCode}
								</div>
							</TableCell>
							<TableCell>
								{Number(advance.requestedAmount).toFixed(2)}
							</TableCell>
							<TableCell>
								{advance.outstandingBalance
									? Number(advance.outstandingBalance).toFixed(2)
									: "-"}
							</TableCell>
							<TableCell>
								{new Date(advance.createdAt).toLocaleDateString()}
							</TableCell>
							<TableCell>
								<Badge
									variant={
										advance.status === "active" ||
										advance.status === "fully_repaid"
											? "primary"
											: advance.status === "pending"
												? "secondary"
												: "outline"
									}
								>
									{advance.status.replace("_", " ")}
								</Badge>
							</TableCell>
							<TableCell className="text-right">
								{advance.status === "pending" && (
									<Button
										size="sm"
										variant="outline"
										onClick={() =>
											handleApprove(advance.id, advance.requestedAmount)
										}
										disabled={approveAdvance.isPending}
									>
										<Check className="mr-2 h-4 w-4" />
										Approve
									</Button>
								)}
								{advance.status === "approved" && (
									<Button
										size="sm"
										variant="outline"
										onClick={() => disburseAdvance.mutate(advance.id)}
										disabled={disburseAdvance.isPending}
									>
										<Check className="mr-2 h-4 w-4" />
										Disburse
									</Button>
								)}
							</TableCell>
						</TableRow>
					))}
					{!advances?.length && (
						<TableRow>
							<TableCell colSpan={6} className="h-24 text-center">
								No salary advances found.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
