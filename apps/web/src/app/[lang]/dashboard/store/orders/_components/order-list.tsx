"use client";

import { Input } from "@workspace/ui/components/input";
import { useState } from "react";
import { OrderCard } from "./order-card";
import type { Order } from "./types";

interface OrderListProps {
	orders: Order[];
	total: number;
	onEditOrder?: (order: Order) => void;
	onDeleteOrder?: (orderId: string) => Promise<void>;
	onCompleteOrder?: (orderId: string) => Promise<void>;
	onCancelOrder?: (orderId: string) => Promise<void>;
}

export const OrderList = ({
	orders,
	total,
	onEditOrder,
	onDeleteOrder,
	onCompleteOrder,
	onCancelOrder,
}: OrderListProps) => {
	const [searchTerm, setSearchTerm] = useState("");

	const filteredOrders = orders.filter((order) => {
		const search = searchTerm.toLowerCase();
		return (
			order.orderNumber.toLowerCase().includes(search) ||
			order.status.toLowerCase().includes(search) ||
			order.customerEmail?.toLowerCase().includes(search) ||
			order.id.toLowerCase().includes(search)
		);
	});

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4">
				<Input
					placeholder="Search orders by number, status, email, or ID..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="max-w-md"
				/>
				<p className="whitespace-nowrap text-muted-foreground text-sm">
					{filteredOrders.length} of {total} orders
				</p>
			</div>

			{filteredOrders.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<p className="mb-4 text-4xl">📦</p>
					<h3 className="mb-2 font-semibold text-lg">No orders found</h3>
					<p className="text-muted-foreground text-sm">
						{searchTerm
							? "Try adjusting your search terms"
							: "Get started by creating your first order"}
					</p>
				</div>
			) : (
				<div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
					{filteredOrders.map((order) => (
						<OrderCard
							key={order.id}
							order={order}
							onEdit={onEditOrder}
							onDelete={onDeleteOrder}
							onComplete={onCompleteOrder}
							onCancel={onCancelOrder}
						/>
					))}
				</div>
			)}
		</div>
	);
};
