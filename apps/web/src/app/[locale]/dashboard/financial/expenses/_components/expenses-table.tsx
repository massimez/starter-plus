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
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { format } from "date-fns";
import {
	Check,
	Copy,
	DollarSign,
	Filter,
	MoreHorizontal,
	Pencil,
	Search,
	X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	useApproveExpense,
	useExpenseCategories,
	useFinancialExpenses,
	usePayExpense,
	useRejectExpense,
} from "@/app/[locale]/dashboard/financial/_hooks/use-financial-expenses";
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

export function ExpensesTable() {
	const { data: expenses, isLoading: isExpensesLoading } =
		useFinancialExpenses(100);
	const { data: categories, isLoading: isCategoriesLoading } =
		useExpenseCategories();
	const approveMutation = useApproveExpense();
	const rejectMutation = useRejectExpense();
	const payMutation = usePayExpense();
	const queryClient = useQueryClient();

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
	const [editOpen, setEditOpen] = useState(false);

	const isLoading = isExpensesLoading || isCategoriesLoading;

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

	const filteredExpenses = (
		Array.isArray(expenses) ? (expenses as unknown as Expense[]) : []
	).filter((expense) => {
		const matchesSearch =
			expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			expense.employee?.firstName
				.toLowerCase()
				.includes(searchQuery.toLowerCase()) ||
			expense.employee?.lastName
				.toLowerCase()
				.includes(searchQuery.toLowerCase()) ||
			expense.user?.name.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesStatus =
			statusFilter === "all" || expense.status === statusFilter;

		const matchesCategory =
			categoryFilter === "all" || expense.category.id === categoryFilter;

		return matchesSearch && matchesStatus && matchesCategory;
	});

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<CardTitle>Expenses</CardTitle>
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
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
							<div className="relative">
								<Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search expenses..."
									className="w-full pl-8 sm:w-[250px]"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-full sm:w-[150px]">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Statuses</SelectItem>
									<SelectItem value="pending">Pending</SelectItem>
									<SelectItem value="approved">Approved</SelectItem>
									<SelectItem value="paid">Paid</SelectItem>
									<SelectItem value="rejected">Rejected</SelectItem>
								</SelectContent>
							</Select>
							<Select value={categoryFilter} onValueChange={setCategoryFilter}>
								<SelectTrigger className="w-full sm:w-[150px]">
									<SelectValue placeholder="Category" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Categories</SelectItem>
									{Array.isArray(categories) &&
										categories.map((category: { id: string; name: string }) => (
											<SelectItem key={category.id} value={category.id}>
												{category.name}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
							{(searchQuery ||
								statusFilter !== "all" ||
								categoryFilter !== "all") && (
								<Button
									variant="ghost"
									onClick={() => {
										setSearchQuery("");
										setStatusFilter("all");
										setCategoryFilter("all");
									}}
									className="px-2 lg:px-3"
								>
									Reset
									<X className="ml-2 h-4 w-4" />
								</Button>
							)}
						</div>
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
								{filteredExpenses.length > 0 ? (
									filteredExpenses.map((expense) => (
										<TableRow key={expense.id}>
											<TableCell className="whitespace-nowrap">
												{format(new Date(expense.expenseDate), "MMM dd, yyyy")}
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
												{new Intl.NumberFormat("en-US", {
													style: "currency",
													currency: expense.currency,
												}).format(Number(expense.amount))}
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
												<p className="text-sm">
													Try adjusting your filters or search query.
												</p>
												{(searchQuery ||
													statusFilter !== "all" ||
													categoryFilter !== "all") && (
													<Button
														variant="link"
														onClick={() => {
															setSearchQuery("");
															setStatusFilter("all");
															setCategoryFilter("all");
														}}
													>
														Clear all filters
													</Button>
												)}
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
