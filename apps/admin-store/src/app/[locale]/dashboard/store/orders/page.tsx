"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@workspace/ui/components/input";
import { PaginationControls } from "@workspace/ui/components/pagination-controls";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { Search, X } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { PageDashboardHeader } from "@/app/[locale]/(landing)/_components/sections/page-dashboard-header";
import { useNuqsPagination } from "@/hooks/use-nuqs-pagination";
import { hc } from "@/lib/api-client";
import { EditOrderDialog } from "./_components/edit-order-dialog";
import { OrderList } from "./_components/order-list";
import type { ORDER_STATUS, Order } from "./_components/types";
import { useOrders } from "./hooks/use-orders";

const ORDER_STATUSES: ORDER_STATUS[] = [
	"draft",
	"pending",
	"confirmed",
	"processing",
	"shipped",
	"delivered",
	"completed",
	"cancelled",
	"failed",
	"returned",
	"paid",
	"refunded",
];

const OrdersPage = () => {
	const queryClient = useQueryClient();
	const [editingOrder, setEditingOrder] = useState<Order | null>(null);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [statusFilter, setStatusFilter] = useQueryState(
		"status",
		parseAsString,
	);
	const [searchQuery, setSearchQuery] = useQueryState(
		"search",
		parseAsString.withDefault("").withOptions({ throttleMs: 500 }),
	);

	const pagination = useNuqsPagination();

	const { data: paginatedOrdersResult, isLoading: isPaginatedLoading } =
		useOrders({
			status: statusFilter || undefined,
			limit: pagination.limit.toString(),
			offset: pagination.offset.toString(),
			search: searchQuery || undefined,
			setTotal: pagination.setTotal,
		});

	const orders = (paginatedOrdersResult?.data || []).map((order) => ({
		...order,
		userId: order.userId ?? undefined,
	}));

	const handleDeleteOrder = async (orderId: string) => {
		try {
			await hc.api.store.orders[":id"].$delete({
				param: { id: orderId },
			});
			queryClient.invalidateQueries({ queryKey: ["orders"] });
		} catch (error) {
			console.error("Failed to delete order:", error);
		}
	};

	const handleCompleteOrder = async (orderId: string) => {
		try {
			await hc.api.store.orders[":id"].complete.$patch({
				param: { id: orderId },
			});
			queryClient.invalidateQueries({ queryKey: ["orders"] });
		} catch (error) {
			console.error("Failed to complete order:", error);
		}
	};

	const handleCancelOrder = async (orderId: string) => {
		try {
			await hc.api.store.orders[":id"].cancel.$patch({
				param: { id: orderId },
			});
			queryClient.invalidateQueries({ queryKey: ["orders"] });
		} catch (error) {
			console.error("Failed to cancel order:", error);
		}
	};

	const handleEditOrder = (order: Order) => {
		setEditingOrder(order);
		setIsEditDialogOpen(true);
	};

	return (
		<div className="p-4">
			<div className="mb-4 space-y-4">
				<PageDashboardHeader title="Orders" />
				<div className="flex items-center gap-4">
					<div className="relative max-w-sm flex-1">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search orders..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value || null);
								pagination.setPage(1);
							}}
							className="pr-9 pl-9"
						/>
						{searchQuery && (
							<button
								type="button"
								onClick={() => {
									setSearchQuery(null);
									pagination.setPage(1);
								}}
								className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground hover:text-foreground"
							>
								<X className="h-4 w-4" />
							</button>
						)}
					</div>
					<Select
						value={statusFilter || "all"}
						onValueChange={(value) => {
							setStatusFilter(value === "all" ? null : value);
							pagination.setPage(1);
						}}
					>
						<SelectTrigger className="w-48">
							<SelectValue placeholder="Filter by status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All statuses</SelectItem>
							{ORDER_STATUSES.map((status) => (
								<SelectItem key={status} value={status}>
									{status.charAt(0).toUpperCase() + status.slice(1)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<OrderList
				// biome-ignore lint/suspicious/noExplicitAny: <>
				orders={orders as any}
				isLoading={isPaginatedLoading}
				onEditOrder={handleEditOrder}
				onDeleteOrder={handleDeleteOrder}
				onCompleteOrder={handleCompleteOrder}
				onCancelOrder={handleCancelOrder}
			/>
			<PaginationControls pagination={pagination} className="mt-4" />
			<EditOrderDialog
				order={editingOrder}
				open={isEditDialogOpen}
				onOpenChange={setIsEditDialogOpen}
			/>
		</div>
	);
};

export default OrdersPage;
