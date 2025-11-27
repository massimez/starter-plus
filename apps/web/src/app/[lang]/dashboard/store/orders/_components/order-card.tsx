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
} from "@workspace/ui/components/alert-dialog";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
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
import {
	Calendar,
	CheckCircle,
	ChevronDown,
	ChevronUp,
	Edit,
	Mail,
	MapPin,
	MoreHorizontal,
	Package,
	Phone,
	Trash2,
	Truck,
	User,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/lib/helpers";
import type { Order } from "./types";

interface OrderCardProps {
	order: Order;
	onEdit?: (order: Order) => void;
	onDelete?: (orderId: string) => Promise<void>;
	onComplete?: (orderId: string) => Promise<void>;
	onCancel?: (orderId: string) => Promise<void>;
}

export const OrderCard = ({
	order,
	onEdit,
	onDelete,
	onComplete,
	onCancel,
}: OrderCardProps) => {
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const getStatusConfig = (status: Order["status"]) => {
		switch (status) {
			case "pending":
				return {
					variant: "secondary" as const,
					color:
						"bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800",
					icon: Package,
				};
			case "paid":
				return {
					variant: "default" as const,
					color:
						"bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
					icon: CheckCircle,
				};
			case "processing":
				return {
					variant: "default" as const,
					color:
						"bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
					icon: Package,
				};
			case "shipped":
				return {
					variant: "default" as const,
					color:
						"bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800",
					icon: Truck,
				};
			case "completed":
				return {
					variant: "default" as const,
					color:
						"bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
					icon: CheckCircle,
				};
			case "cancelled":
			case "refunded":
				return {
					variant: "destructive" as const,
					color:
						"bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
					icon: XCircle,
				};
			default:
				return {
					variant: "secondary" as const,
					color:
						"bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800",
					icon: Package,
				};
		}
	};

	const handleDelete = async () => {
		setIsLoading(true);
		try {
			if (onDelete) {
				await onDelete(order.id);
			}
		} finally {
			setIsLoading(false);
			setDeleteDialogOpen(false);
		}
	};

	const handleComplete = async () => {
		setIsLoading(true);
		try {
			if (onComplete) {
				await onComplete(order.id);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancel = async () => {
		setIsLoading(true);
		try {
			if (onCancel) {
				await onCancel(order.id);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const statusConfig = getStatusConfig(order.status);
	const StatusIcon = statusConfig.icon;
	const itemCount = order.items?.length || 0;

	return (
		<>
			<Card className="hover:-translate-y-0.5 flex h-full w-full flex-col transition-all duration-200 hover:shadow-lg">
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between gap-4">
						<div className="min-w-0 flex-1">
							<div className="mb-1 flex flex-wrap items-center gap-2">
								<CardTitle className="font-semibold text-base">
									<button className="text-left" onClick={() => onEdit?.(order)}>
										Order #{order.orderNumber}
									</button>
								</CardTitle>
								<Badge
									className={`${statusConfig.color} flex items-center gap-1 border font-medium`}
								>
									<StatusIcon className="h-3 w-3" />
									{order.status.replace("_", " ").toUpperCase()}
								</Badge>
							</div>
							<CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
								{order.customerFullName && (
									<span className="flex items-center gap-1">
										<User className="h-3 w-3" />
										<span className="max-w-[150px] truncate">
											{order.customerFullName}
										</span>
									</span>
								)}
								{order.customerEmail && (
									<span className="flex items-center gap-1">
										<Mail className="h-3 w-3" />
										<span className="max-w-[150px] truncate">
											{order.customerEmail}
										</span>
									</span>
								)}
								{order.customerPhone && (
									<span className="flex items-center gap-1">
										<Phone className="h-3 w-3" />
										<span className="max-w-[150px] truncate">
											{order.customerPhone}
										</span>
									</span>
								)}
								<span className="flex items-center gap-1">
									<Calendar className="h-3 w-3" />
									{new Date(order.orderDate).toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
										year: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</span>
							</CardDescription>
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 shrink-0 p-0"
									disabled={isLoading}
								>
									<MoreHorizontal className="h-4 w-4" />
									<span className="sr-only">Open menu</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								{["pending", "processing", "shipped"].includes(
									order.status,
								) && (
									<DropdownMenuItem
										onClick={handleComplete}
										disabled={isLoading}
									>
										<CheckCircle className="mr-2 h-4 w-4 text-green-600" />
										Mark as Complete
									</DropdownMenuItem>
								)}
								<DropdownMenuItem
									onClick={() => {
										if (onEdit) {
											onEdit(order);
										}
									}}
									disabled={isLoading}
								>
									<Edit className="mr-2 h-4 w-4" />
									Edit Order
								</DropdownMenuItem>
								{["pending", "paid", "processing"].includes(order.status) && (
									<>
										<DropdownMenuItem
											onClick={handleCancel}
											disabled={isLoading}
										>
											<XCircle className="mr-2 h-4 w-4 text-orange-600" />
											Cancel Order
										</DropdownMenuItem>
										<DropdownMenuSeparator />
									</>
								)}
								<DropdownMenuItem
									onClick={() => setDeleteDialogOpen(true)}
									className="text-destructive focus:text-destructive"
									disabled={isLoading}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete Order
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</CardHeader>

				<CardContent className="flex-1 space-y-4 pt-0">
					{/* Quick Info Grid */}
					<div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3">
						<div className="space-y-1">
							<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
								Total Amount
							</p>
							<p className="font-bold text-lg">
								{formatCurrency(
									Number.parseFloat(order.totalAmount),
									order.currency,
								)}
							</p>
						</div>
						<div className="space-y-1">
							<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
								Items
							</p>
							<p className="flex items-center gap-1 font-bold text-lg">
								<Package className="h-4 w-4 text-muted-foreground" />
								{itemCount}
							</p>
						</div>
					</div>

					{/* Shipping Info */}
					{order.shippingMethod && (
						<div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
							<Truck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
							<div className="min-w-0 flex-1">
								<p className="font-medium text-blue-900 text-sm dark:text-blue-100">
									{order.shippingMethod}
								</p>
								{order.trackingNumber && (
									<p className="mt-1 break-all font-mono text-blue-700 text-xs dark:text-blue-300">
										Tracking: {order.trackingNumber}
									</p>
								)}
							</div>
						</div>
					)}

					{/* Shipping Address */}
					{order.shippingAddress && (
						<div className="flex items-start gap-2 text-sm">
							<MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
							<div className="min-w-0 flex-1">
								<p className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
									Shipping Address
								</p>
								<p className="text-sm leading-relaxed">
									{order.shippingAddress.street}
									<br />
									{order.shippingAddress.city}, {order.shippingAddress.state}{" "}
									{order.shippingAddress.zipCode}
								</p>
							</div>
						</div>
					)}

					{/* Items List */}
					{order.items && order.items.length > 0 && (
						<div className="space-y-2">
							<button
								onClick={() => setIsExpanded(!isExpanded)}
								className="group -mx-2 flex w-full items-center justify-between rounded p-2 font-medium text-sm transition-colors hover:bg-muted/30 hover:text-primary"
								aria-expanded={isExpanded}
								aria-label={isExpanded ? "Collapse items" : "Expand items"}
							>
								<span className="flex items-center gap-2">
									<Package className="h-4 w-4" />
									Order Items ({itemCount})
								</span>
								<span className="flex items-center gap-1">
									{isExpanded ? (
										<ChevronUp className="h-4 w-4" />
									) : (
										<ChevronDown className="h-4 w-4" />
									)}
								</span>
							</button>

							{isExpanded && (
								<div className="fade-in slide-in-from-top-2 animate-in space-y-1.5 duration-200">
									{order.items.map((item) => (
										<div
											key={item.id}
											className="flex items-start justify-between gap-2 rounded bg-muted/30 p-2 transition-colors hover:bg-muted/50"
										>
											<span className="min-w-0 flex-1 text-sm">
												<span className="font-medium">{item.productName}</span>
												{item.variantName && (
													<span className="text-muted-foreground">
														{" "}
														• {item.variantName}
													</span>
												)}
												{item.quantity > 1 && (
													<span className="text-muted-foreground">
														{" "}
														× {item.quantity}
													</span>
												)}
												{item.sku && (
													<span className="mt-0.5 block text-muted-foreground text-xs">
														SKU: {item.sku}
													</span>
												)}
											</span>
											<span className="whitespace-nowrap font-semibold text-sm">
												{formatCurrency(
													Number.parseFloat(item.unitPrice) * item.quantity,
													order.currency,
												)}
											</span>
										</div>
									))}
								</div>
							)}

							{!isExpanded && (
								<div className="py-1 text-center text-muted-foreground text-xs">
									Click to view items
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2">
							<Trash2 className="h-5 w-5 text-destructive" />
							Delete Order #{order.orderNumber}?
						</AlertDialogTitle>
						<AlertDialogDescription className="space-y-2">
							<p>
								This action cannot be undone. This will permanently delete the
								order and remove all associated data.
							</p>
							<p className="font-medium">
								• {itemCount} item{itemCount !== 1 ? "s" : ""} worth{" "}
								{formatCurrency(
									Number.parseFloat(order.totalAmount),
									order.currency,
								)}
							</p>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isLoading}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isLoading ? "Deleting..." : "Delete Order"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};
