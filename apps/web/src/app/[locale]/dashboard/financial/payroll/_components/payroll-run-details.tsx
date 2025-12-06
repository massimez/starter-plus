"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Separator } from "@workspace/ui/components/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { cn } from "@workspace/ui/lib/utils";
import {
	Calculator,
	CheckCircle,
	ChevronDown,
	ChevronRight,
	Clock,
	Eye,
	Play,
} from "lucide-react";
import { useState } from "react";
import { useFinancialPayroll } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-payroll";

interface PayrollEntryDetail {
	id: string;
	amount: string;
	salaryComponentId: string;
	component: {
		name: string;
		componentType: "earning" | "deduction" | "employer_contribution";
	};
}

interface PayrollEntry {
	id: string;
	baseSalary: string;
	grossSalary: string;
	totalDeductions: string;
	netSalary: string;
	status: "pending" | "paid";
	employee: {
		firstName: string;
		lastName: string;
		employeeCode: string;
	};
	details: PayrollEntryDetail[];
}

interface PayrollRunDetailsData {
	id: string;
	payrollPeriodStart: string;
	payrollPeriodEnd: string;
	paymentDate: string;
	status: string;
	totalGross?: string | null;
	totalNet?: string | null;
	entries?: PayrollEntry[];
}

interface PayrollRunDetailsProps {
	payrollRun: {
		id: string;
		payrollPeriodStart: string;
		payrollPeriodEnd: string;
		paymentDate: string;
		status: string;
		totalGross?: string | null;
		totalNet?: string | null;
	};
}

export function PayrollRunDetails({ payrollRun }: PayrollRunDetailsProps) {
	const [open, setOpen] = useState(false);
	const [expandedEntries, setExpandedEntries] = useState<Set<string>>(
		new Set(),
	);
	const {
		usePayrollRunDetails,
		useCalculatePayroll,
		useApprovePayrollRun,
		useProcessPayrollPayments,
	} = useFinancialPayroll();

	const { data, isLoading } = usePayrollRunDetails(payrollRun.id);
	const details = data as PayrollRunDetailsData | undefined;
	const calculatePayroll = useCalculatePayroll();
	const approvePayrollRun = useApprovePayrollRun();
	const processPayments = useProcessPayrollPayments();

	const toggleEntry = (entryId: string) => {
		const newExpanded = new Set(expandedEntries);
		if (newExpanded.has(entryId)) {
			newExpanded.delete(entryId);
		} else {
			newExpanded.add(entryId);
		}
		setExpandedEntries(newExpanded);
	};

	const handleCalculate = () => {
		calculatePayroll.mutate(payrollRun.id, {
			onSuccess: () => {
				// Refetch details handled by query invalidation
			},
		});
	};

	const handleApprove = () => {
		approvePayrollRun.mutate(payrollRun.id, {
			onSuccess: () => {
				setOpen(false);
			},
		});
	};

	const handleProcessPayments = () => {
		if (details?.entries?.length) {
			const pendingEntries = details.entries
				.filter((entry) => entry.status === "pending")
				.map((entry) => entry.id);

			if (pendingEntries.length > 0) {
				processPayments.mutate({ entryIds: pendingEntries });
			}
		}
	};

	const formatCurrency = (amount: string | number | null | undefined) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(Number(amount || 0));
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="ghost" size="sm">
					<Eye className="mr-2 h-4 w-4" />
					View Details
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[80vh] max-w-6xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Payroll Run Details</DialogTitle>
					<DialogDescription>
						Period:{" "}
						{new Date(payrollRun.payrollPeriodStart).toLocaleDateString()} -{" "}
						{new Date(payrollRun.payrollPeriodEnd).toLocaleDateString()}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Status and Actions */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<Badge
								variant={
									payrollRun.status === "paid"
										? "success"
										: payrollRun.status === "approved"
											? "secondary"
											: payrollRun.status === "draft"
												? "outline"
												: "secondary"
								}
								className="capitalize"
							>
								{payrollRun.status}
							</Badge>

							{/* Status indicators */}
							{payrollRun.status === "draft" && (
								<div className="flex items-center gap-2 text-muted-foreground text-sm">
									<Calculator className="h-4 w-4" />
									Ready to calculate
								</div>
							)}

							{payrollRun.status === "calculated" && (
								<div className="flex items-center gap-2 text-muted-foreground text-sm">
									<Clock className="h-4 w-4" />
									Awaiting approval
								</div>
							)}

							{payrollRun.status === "approved" && (
								<div className="flex items-center gap-2 text-muted-foreground text-sm">
									<CheckCircle className="h-4 w-4" />
									Ready for payment
								</div>
							)}
						</div>

						<div className="space-x-2">
							{payrollRun.status === "draft" && (
								<Button
									onClick={handleCalculate}
									disabled={calculatePayroll.isPending}
								>
									<Calculator className="mr-2 h-4 w-4" />
									{calculatePayroll.isPending ? "Calculating..." : "Calculate"}
								</Button>
							)}

							{payrollRun.status === "calculated" && (
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button
											variant="outline"
											disabled={approvePayrollRun.isPending}
										>
											<CheckCircle className="mr-2 h-4 w-4" />
											Approve
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>Approve Payroll Run?</AlertDialogTitle>
											<AlertDialogDescription>
												This will lock the payroll run and prepare it for
												payment. You won't be able to recalculate after this.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancel</AlertDialogCancel>
											<AlertDialogAction onClick={handleApprove}>
												Approve
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							)}

							{payrollRun.status === "approved" && (
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button
											variant="outline"
											disabled={processPayments.isPending}
										>
											<Play className="mr-2 h-4 w-4" />
											Process Payments
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>Process Payments?</AlertDialogTitle>
											<AlertDialogDescription>
												This will mark all pending entries as paid. Ensure you
												have executed the bank transfers.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancel</AlertDialogCancel>
											<AlertDialogAction onClick={handleProcessPayments}>
												Process Payments
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							)}
						</div>
					</div>

					<Separator />

					{/* Summary */}
					<div className="grid grid-cols-3 gap-4">
						<div className="rounded border p-4 text-center">
							<div className="font-bold text-2xl">
								{formatCurrency(payrollRun.totalGross)}
							</div>
							<div className="text-muted-foreground text-sm">Total Gross</div>
						</div>

						<div className="rounded border p-4 text-center">
							<div className="font-bold text-2xl">
								{formatCurrency(payrollRun.totalNet)}
							</div>
							<div className="text-muted-foreground text-sm">Total Net</div>
						</div>

						<div className="rounded border p-4 text-center">
							<div className="font-bold text-2xl">
								{details?.entries?.length || 0}
							</div>
							<div className="text-muted-foreground text-sm">Employees</div>
						</div>
					</div>

					{/* Employee Entries */}
					<div className="space-y-4">
						<h3 className="font-semibold text-lg">Employee Entries</h3>

						{isLoading ? (
							<div className="py-8 text-center">
								<div className="mx-auto h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
								<p className="mt-2 text-muted-foreground">
									Loading payroll details...
								</p>
							</div>
						) : details?.entries?.length ? (
							<div className="rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-[30px]" />
											<TableHead>Employee</TableHead>
											<TableHead>Code</TableHead>
											<TableHead>Base Salary</TableHead>
											<TableHead>Gross Salary</TableHead>
											<TableHead>Deductions</TableHead>
											<TableHead>Net Salary</TableHead>
											<TableHead>Status</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{details.entries.map((entry) => (
											<>
												<TableRow
													key={entry.id}
													className={cn(
														"cursor-pointer hover:bg-muted/50",
														expandedEntries.has(entry.id) && "bg-muted/50",
													)}
													onClick={() => toggleEntry(entry.id)}
												>
													<TableCell>
														{expandedEntries.has(entry.id) ? (
															<ChevronDown className="h-4 w-4 text-muted-foreground" />
														) : (
															<ChevronRight className="h-4 w-4 text-muted-foreground" />
														)}
													</TableCell>
													<TableCell className="font-medium">
														{entry.employee?.firstName}{" "}
														{entry.employee?.lastName}
													</TableCell>
													<TableCell>{entry.employee?.employeeCode}</TableCell>
													<TableCell>
														{formatCurrency(entry.baseSalary)}
													</TableCell>
													<TableCell>
														{formatCurrency(entry.grossSalary)}
													</TableCell>
													<TableCell>
														{formatCurrency(entry.totalDeductions)}
													</TableCell>
													<TableCell>
														{formatCurrency(entry.netSalary)}
													</TableCell>
													<TableCell>
														<Badge
															variant={
																entry.status === "paid"
																	? "success"
																	: entry.status === "pending"
																		? "secondary"
																		: "outline"
															}
															className="capitalize"
														>
															{entry.status || "pending"}
														</Badge>
													</TableCell>
												</TableRow>
												{expandedEntries.has(entry.id) && (
													<TableRow className="bg-muted/30 hover:bg-muted/30">
														<TableCell colSpan={8} className="p-0">
															<div className="p-4 pl-12">
																<div className="grid grid-cols-2 gap-8">
																	<div>
																		<h4 className="mb-2 font-medium text-sm">
																			Earnings
																		</h4>
																		<div className="space-y-1">
																			{entry.details
																				?.filter(
																					(d) =>
																						d.component.componentType ===
																						"earning",
																				)
																				.map((detail) => (
																					<div
																						key={detail.id}
																						className="flex justify-between text-sm"
																					>
																						<span className="text-muted-foreground">
																							{detail.component.name}
																						</span>
																						<span>
																							{formatCurrency(detail.amount)}
																						</span>
																					</div>
																				))}
																			<div className="flex justify-between border-t pt-1 font-medium text-sm">
																				<span>Total Earnings</span>
																				<span>
																					{formatCurrency(entry.grossSalary)}
																				</span>
																			</div>
																		</div>
																	</div>
																	<div>
																		<h4 className="mb-2 font-medium text-sm">
																			Deductions
																		</h4>
																		<div className="space-y-1">
																			{entry.details
																				?.filter(
																					(d) =>
																						d.component.componentType ===
																						"deduction",
																				)
																				.map((detail) => (
																					<div
																						key={detail.id}
																						className="flex justify-between text-sm"
																					>
																						<span className="text-muted-foreground">
																							{detail.component.name}
																						</span>
																						<span className="text-destructive">
																							-{formatCurrency(detail.amount)}
																						</span>
																					</div>
																				))}
																			<div className="flex justify-between border-t pt-1 font-medium text-sm">
																				<span>Total Deductions</span>
																				<span className="text-destructive">
																					-
																					{formatCurrency(
																						entry.totalDeductions,
																					)}
																				</span>
																			</div>
																		</div>
																	</div>
																</div>
															</div>
														</TableCell>
													</TableRow>
												)}
											</>
										))}
									</TableBody>
								</Table>
							</div>
						) : (
							<div className="rounded border py-8 text-center">
								<p className="text-muted-foreground">
									{payrollRun.status === "draft"
										? "Run payroll calculation to see employee entries."
										: "No employee entries found for this payroll run."}
								</p>
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
