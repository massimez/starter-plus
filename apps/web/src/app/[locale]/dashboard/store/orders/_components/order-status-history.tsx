"use client";

import { Badge } from "@workspace/ui/components/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Check, Clock, X } from "lucide-react";

type OrderStatus =
	| "draft"
	| "pending"
	| "confirmed"
	| "processing"
	| "shipped"
	| "delivered"
	| "completed"
	| "cancelled"
	| "failed"
	| "returned"
	| "paid"
	| "refunded";

interface OrderStatusHistoryRecord {
	id: string;
	organizationId: string;
	orderId: string;
	status: OrderStatus;
	previousStatus: OrderStatus | null;
	notes: string | null;
	metadata: unknown;
	createdAt: string;
	updatedAt: string | null;
	createdBy: string | null;
	updatedBy: string | null;
}

interface OrderStatusHistoryProps {
	orderId: string;
	history?: OrderStatusHistoryRecord[];
	isLoading?: boolean;
}

const STATUS_CONFIG: Record<OrderStatus, { color: string; label: string }> = {
	draft: { color: "bg-gray-100 text-gray-800 border-gray-200", label: "Draft" },
	pending: {
		color: "bg-yellow-100 text-yellow-800 border-yellow-200",
		label: "Pending",
	},
	confirmed: {
		color: "bg-blue-100 text-blue-800 border-blue-200",
		label: "Confirmed",
	},
	processing: {
		color: "bg-purple-100 text-purple-800 border-purple-200",
		label: "Processing",
	},
	shipped: {
		color: "bg-indigo-100 text-indigo-800 border-indigo-200",
		label: "Shipped",
	},
	delivered: {
		color: "bg-green-100 text-green-800 border-green-200",
		label: "Delivered",
	},
	completed: {
		color: "bg-emerald-100 text-emerald-800 border-emerald-200",
		label: "Completed",
	},
	cancelled: {
		color: "bg-red-100 text-red-800 border-red-200",
		label: "Cancelled",
	},
	failed: { color: "bg-red-100 text-red-800 border-red-200", label: "Failed" },
	returned: {
		color: "bg-orange-100 text-orange-800 border-orange-200",
		label: "Returned",
	},
	paid: { color: "bg-teal-100 text-teal-800 border-teal-200", label: "Paid" },
	refunded: {
		color: "bg-pink-100 text-pink-800 border-pink-200",
		label: "Refunded",
	},
};

export const OrderStatusHistory = ({
	history = [],
	isLoading = false,
}: OrderStatusHistoryProps) => {
	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Clock className="h-4 w-4" />
						Order Status History
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center py-8">
						<Clock className="h-6 w-6 animate-pulse text-muted-foreground" />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Clock className="h-4 w-4" />
					Order Status History
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{history.length === 0 ? (
					<div className="py-4 text-center text-muted-foreground">
						No status history available
					</div>
				) : (
					history.map((entry, index) => {
						const statusConfig = STATUS_CONFIG[entry.status as OrderStatus];
						const previousStatusConfig = entry.previousStatus
							? STATUS_CONFIG[entry.previousStatus as OrderStatus]
							: null;

						return (
							<div
								key={`${entry.id}-${entry.createdAt}-${index}`}
								className="flex items-start gap-3 rounded-lg bg-muted/50 p-3"
							>
								<div className="mt-1 shrink-0">
									{entry.status === "completed" ? (
										<Check className="h-4 w-4 text-green-600" />
									) : entry.status === "cancelled" ? (
										<X className="h-4 w-4 text-red-600" />
									) : (
										<Clock className="h-4 w-4 text-muted-foreground" />
									)}
								</div>
								<div className="flex-1 space-y-1">
									<div className="flex flex-wrap items-center gap-2">
										{previousStatusConfig && (
											<>
												<Badge
													className={`${previousStatusConfig.color} border text-xs`}
												>
													{previousStatusConfig.label}
												</Badge>
												<span className="text-muted-foreground text-xs">→</span>
											</>
										)}
										<Badge className={`${statusConfig.color} border text-xs`}>
											{statusConfig.label}
										</Badge>
									</div>
									{entry.notes && (
										<p className="text-muted-foreground text-sm">
											{entry.notes}
										</p>
									)}
									<p className="text-muted-foreground text-xs">
										{new Date(entry.createdAt).toLocaleString("en-US", {
											year: "numeric",
											month: "short",
											day: "numeric",
											hour: "2-digit",
											minute: "2-digit",
											second: "2-digit",
										})}
									</p>
								</div>
							</div>
						);
					})
				)}
			</CardContent>
		</Card>
	);
};
