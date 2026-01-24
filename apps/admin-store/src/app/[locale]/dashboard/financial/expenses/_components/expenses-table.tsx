"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import {
	Check,
	Copy,
	DollarSign,
	Filter,
	MoreHorizontal,
	Pencil,
	X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	useApproveExpense,
	usePayExpense,
	useRejectExpense,
} from "@/app/[locale]/dashboard/financial/_hooks/use-financial-expenses";
import { formatDate } from "@/lib/date";
import { formatCurrency } from "@/lib/helpers";
import { CreateExpenseSheet } from "./create-expense-sheet";

type Expense = {
	id: string;
	expenseDate: string;
	description: string;
	amount: string;
	currency: string;
	status: "pending" | "approved" | "rejected" | "paid";
	category: {
		id: string;
		name: string;
	};
	employee: {
		firstName: string;
		lastName: string;
	} | null;
	user: {
		name: string;
	} | null;
};

interface ExpensesTableProps {
	data: Expense[];
	isLoading: boolean;
}

export function ExpensesTable({
	data: expenses,
	isLoading,
}: ExpensesTableProps) {
	const approveMutation = useApproveExpense();
	const rejectMutation = useRejectExpense();
	const payMutation = usePayExpense();
	const queryClient = useQueryClient();

	const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
	const [editOpen, setEditOpen] = useState(false);

	const handleApprove = (id: string) => {
		toast.promise(approveMutation.mutateAsync(id), {
			loading: "Approving expense...",
			success: () => {
				queryClient.invalidateQueries({ queryKey: ["financial", "expenses"] });
				return "Expense approved successfully";
			},
			error: "Failed to approve expense",
		});
	};

	const handleReject = (id: string) => {
		toast.promise(rejectMutation.mutateAsync(id), {
			loading: "Rejecting expense...",
			success: () => {
				queryClient.invalidateQueries({ queryKey: ["financial", "expenses"] });
				return "Expense rejected successfully";
			},
			error: "Failed to reject expense",
		});
	};

	const handlePay = (id: string) => {
		toast.promise(payMutation.mutateAsync(id), {
			loading: "Processing payment...",
			success: () => {
				queryClient.invalidateQueries({ queryKey: ["financial", "expenses"] });
				return "Expense marked as paid";
			},
			error: "Failed to pay expense",
		});
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<CardTitle>Expenses List</CardTitle>
					</div>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex gap-4">
							<Skeleton className="h-10 w-[200px]" />
							<Skeleton className="h-10 w-[150px]" />
							<Skeleton className="h-10 w-[150px]" />
						</div>
						<div className="space-y-2">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<CardTitle>Expenses List</CardTitle>
					</div>
				</CardHeader>
				<CardContent>
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Date</TableHead>
									<TableHead>Description</TableHead>
									<TableHead>Category</TableHead>
									<TableHead>Requested By</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Amount</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{(expenses as Expense[])?.length > 0 ? (
									(expenses as Expense[]).map((expense) => (
										<TableRow key={expense.id}>
											<TableCell className="whitespace-nowrap">
												{formatDate(expense.expenseDate, "MMM dd, yyyy")}
											</TableCell>
											<TableCell className="font-medium">
												{expense.description}
											</TableCell>
											<TableCell>
												<Badge variant="outline">{expense.category.name}</Badge>
											</TableCell>
											<TableCell>
												{expense.employee
													? `${expense.employee.firstName} ${expense.employee.lastName}`
													: expense.user?.name || "Unknown"}
											</TableCell>
											<TableCell>
												<Badge
													variant={
														expense.status === "paid"
															? "success"
															: expense.status === "approved"
																? "secondary"
																: expense.status === "rejected"
																	? "destructive"
																	: expense.status === "pending"
																		? "warning"
																		: "outline"
													}
													className="capitalize"
												>
													{expense.status}
												</Badge>
											</TableCell>
											<TableCell className="text-right font-medium">
												{formatCurrency(
													Number(expense.amount),
													expense.currency,
												)}
											</TableCell>
											<TableCell className="text-right">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" className="h-8 w-8 p-0">
															<span className="sr-only">Open menu</span>
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															onClick={() => {
																navigator.clipboard.writeText(expense.id);
																toast.success("Expense ID copied");
															}}
														>
															<Copy className="mr-2 h-4 w-4" />
															Copy ID
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														{expense.status === "pending" && (
															<>
																<DropdownMenuItem
																	onClick={() => {
																		setSelectedExpense(expense);
																		setEditOpen(true);
																	}}
																>
																	<Pencil className="mr-2 h-4 w-4" />
																	Edit
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() => handleApprove(expense.id)}
																>
																	<Check className="mr-2 h-4 w-4" />
																	Approve
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() => handleReject(expense.id)}
																	className="text-red-600 focus:text-red-600"
																>
																	<X className="mr-2 h-4 w-4" />
																	Reject
																</DropdownMenuItem>
															</>
														)}
														{expense.status === "approved" && (
															<DropdownMenuItem
																onClick={() => handlePay(expense.id)}
															>
																<DollarSign className="mr-2 h-4 w-4" />
																Mark as Paid
															</DropdownMenuItem>
														)}
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell
											colSpan={7}
											className="h-64 text-center text-muted-foreground"
										>
											<div className="flex flex-col items-center justify-center gap-2">
												<div className="rounded-full bg-muted/50 p-4">
													<Filter className="h-8 w-8 text-muted-foreground/50" />
												</div>
												<p className="font-medium text-lg">No expenses found</p>
											</div>
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			{selectedExpense && (
				<CreateExpenseSheet
					key={selectedExpense.id}
					expenseToEdit={selectedExpense}
					open={editOpen}
					onOpenChange={(open) => {
						setEditOpen(open);
						if (!open) setSelectedExpense(null);
					}}
				/>
			)}
		</>
	);
}
