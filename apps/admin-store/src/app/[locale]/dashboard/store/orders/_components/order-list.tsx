"use client";

import { LoaderContainer } from "@workspace/ui/components/loader";
import { OrderCard } from "./order-card";
import type { Order } from "./types";

interface OrderListProps {
	orders: Order[];
	onEditOrder?: (order: Order) => void;
	onDeleteOrder?: (orderId: string) => Promise<void>;
	onCompleteOrder?: (orderId: string) => Promise<void>;
	onCancelOrder?: (orderId: string) => Promise<void>;
	isLoading?: boolean;
}

export const OrderList = ({
	orders,
	onEditOrder,
	onDeleteOrder,
	onCompleteOrder,
	onCancelOrder,
	isLoading,
}: OrderListProps) => {
	if (isLoading) return <LoaderContainer />;
	return (
		<div className="space-y-4">
			{orders.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<p className="mb-4 text-4xl">📦</p>
					<h3 className="mb-2 font-semibold text-lg">No orders found</h3>
					<p className="text-muted-foreground text-sm">
						Try adjusting your search or filter criteria
					</p>
				</div>
			) : (
				<div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
					{orders.map((order) => (
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
