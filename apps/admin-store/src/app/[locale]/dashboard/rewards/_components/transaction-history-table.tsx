"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
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
	ArrowDownCircle,
	ArrowUpCircle,
	ChevronLeft,
	ChevronRight,
	Clock,
	Gift,
	ShoppingCart,
	TrendingUp,
	Users,
	X,
} from "lucide-react";
import { type ComponentType, useState } from "react";
import { hc } from "@/lib/api-client";

interface Transaction {
	id: string;
	type: string;
	points: number;
	balanceBefore: number;
	balanceAfter: number;
	description: string | null;
	status: "pending" | "confirmed" | "canceled";
	createdAt: string;
}

interface TransactionHistoryTableProps {
	userId: string;
	bonusProgramId: string;
}

const TRANSACTION_ICONS: Record<
	string,
	ComponentType<{ className?: string }>
> = {
	earned_purchase: ShoppingCart,
	earned_referral: Users,
	earned_manual: Gift,
	earned_milestone: TrendingUp,
	redeemed_discount: ArrowDownCircle,
	deducted_manual: ArrowDownCircle,
	expired: Clock,
	canceled: X,
};

const TRANSACTION_COLORS: Record<string, string> = {
	earned_purchase: "text-green-600 dark:text-green-400",
	earned_referral: "text-blue-600 dark:text-blue-400",
	earned_manual: "text-purple-600 dark:text-purple-400",
	earned_milestone: "text-amber-600 dark:text-amber-400",
	redeemed_discount: "text-red-600 dark:text-red-400",
	deducted_manual: "text-red-600 dark:text-red-400",
	expired: "text-gray-600 dark:text-gray-400",
	canceled: "text-gray-600 dark:text-gray-400",
};

export const TransactionHistoryTable = ({
	userId,
	bonusProgramId,
}: TransactionHistoryTableProps) => {
	const [page, setPage] = useState(0);
	const limit = 20;

	const { data: response, isLoading } = useQuery({
		queryKey: ["transaction-history", userId, bonusProgramId, page],
		queryFn: async () => {
			const res = await hc.api.store.points.history[":userId"].$get({
				param: { userId: userId },
				query: {
					bonusProgramId,
					limit: limit.toString(),
					offset: (page * limit).toString(),
				},
			});
			return await res.json();
		},
	});

	const transactions = response?.data?.transactions || [];
	const total = response?.data?.total || 0;
	const totalPages = Math.ceil(total / limit);

	const formatType = (type: string) => {
		return type
			.split("_")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(date);
	};

	const getStatusBadge = (status: string) => {
		const variants: Record<
			string,
			"primary" | "secondary" | "destructive" | "outline"
		> = {
			confirmed: "primary",
			pending: "secondary",
			canceled: "destructive",
		};

		return (
			<Badge variant={variants[status] || "outline"} className="text-xs">
				{status.charAt(0).toUpperCase() + status.slice(1)}
			</Badge>
		);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Transaction History</CardTitle>
				<CardDescription>
					View all points transactions for this user
				</CardDescription>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="space-y-3">
						{[1, 2, 3, 4, 5].map((i) => (
							<Skeleton key={i} className="h-16 w-full" />
						))}
					</div>
				) : transactions.length === 0 ? (
					<div className="py-12 text-center text-muted-foreground">
						<Clock className="mx-auto mb-4 h-12 w-12 opacity-50" />
						<p className="font-medium">No transactions yet</p>
						<p className="mt-1 text-sm">
							Transactions will appear here as the user earns or redeems points
						</p>
					</div>
				) : (
					<>
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Date</TableHead>
										<TableHead>Type</TableHead>
										<TableHead>Description</TableHead>
										<TableHead className="text-right">Points</TableHead>
										<TableHead className="text-right">Balance After</TableHead>
										<TableHead>Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{transactions.map((transaction: Transaction) => {
										const Icon =
											TRANSACTION_ICONS[transaction.type] || ArrowUpCircle;
										const color =
											TRANSACTION_COLORS[transaction.type] || "text-gray-600";
										const isPositive = transaction.points > 0;

										return (
											<TableRow key={transaction.id}>
												<TableCell className="text-sm">
													{formatDate(transaction.createdAt)}
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-2">
														<Icon className={cn("h-4 w-4", color)} />
														<span className="text-sm">
															{formatType(transaction.type)}
														</span>
													</div>
												</TableCell>
												<TableCell className="max-w-xs truncate text-sm">
													{transaction.description || "-"}
												</TableCell>
												<TableCell className="text-right">
													<span
														className={cn(
															"font-semibold",
															isPositive
																? "text-green-600 dark:text-green-400"
																: "text-red-600 dark:text-red-400",
														)}
													>
														{isPositive ? "+" : ""}
														{transaction.points.toLocaleString()}
													</span>
												</TableCell>
												<TableCell className="text-right font-medium text-sm">
													{transaction.balanceAfter.toLocaleString()}
												</TableCell>
												<TableCell>
													{getStatusBadge(transaction.status)}
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="mt-4 flex items-center justify-between">
								<p className="text-muted-foreground text-sm">
									Showing {page * limit + 1} to{" "}
									{Math.min((page + 1) * limit, total)} of {total} transactions
								</p>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setPage((p) => Math.max(0, p - 1))}
										disabled={page === 0}
									>
										<ChevronLeft className="h-4 w-4" />
										Previous
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setPage((p) => Math.min(totalPages - 1, p + 1))
										}
										disabled={page >= totalPages - 1}
									>
										Next
										<ChevronRight className="h-4 w-4" />
									</Button>
								</div>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
};
