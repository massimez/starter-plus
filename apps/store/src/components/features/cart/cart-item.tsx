"use client";

import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useCartStore } from "@/store/use-cart-store";

interface CartItem {
	id: string;
	name: string;
	price: number;
	quantity: number;
	image?: string;
	description?: string;
}

interface CartItemProps {
	item: CartItem;
}

export function CartItem({ item }: CartItemProps) {
	const t = useTranslations("Cart");
	const { updateQuantity, removeItem } = useCartStore();
	const [quantity, setQuantity] = useState(item.quantity);

	const handleQuantityChange = (newQuantity: number) => {
		if (newQuantity === 0) {
			removeItem(item.id);
			return;
		}

		setQuantity(newQuantity);
		updateQuantity(item.id, newQuantity);
	};

	const handleRemove = () => {
		removeItem(item.id);
	};

	const incrementQuantity = () => {
		handleQuantityChange(quantity + 1);
	};

	const decrementQuantity = () => {
		handleQuantityChange(quantity - 1);
	};

	const totalPrice = item.price * quantity;

	return (
		<Card className="overflow-hidden py-4">
			<CardContent className="p-2">
				<div className="flex gap-4">
					{/* Product Image */}
					<div className="shrink-0">
						<div className="relative size-16 overflow-hidden rounded-md bg-muted">
							{item.image ? (
								<Image
									src={item.image}
									alt={item.name}
									fill
									className="object-cover"
									sizes="64px"
								/>
							) : (
								<div className="flex h-full items-center justify-center text-2xl">
									📦
								</div>
							)}
						</div>
					</div>

					{/* Product Details */}
					<div className="min-w-0 flex-1">
						<div className="flex items-start justify-between gap-2">
							<div className="min-w-0 flex-1">
								<h4 className="truncate font-medium text-sm">{item.name}</h4>
								{item.description && (
									<p className="mt-1 line-clamp-2 text-muted-foreground text-xs">
										{item.description}
									</p>
								)}
								<div className="mt-3 flex items-center justify-between">
									<p className="font-semibold text-sm">
										${totalPrice.toFixed(2)}
									</p>
									<p className="text-muted-foreground text-xs">
										${item.price.toFixed(2)} each
									</p>
								</div>
							</div>

							{/* Quantity Controls */}
							<div className="flex flex-col items-end gap-2">
								{/* Remove Button */}
								<Button
									variant="ghost"
									size="icon"
									className="size-6 h-6 w-6"
									onClick={handleRemove}
									title={t("remove")}
								>
									<X className="size-3" />
								</Button>

								{/* Quantity Selector */}
								<div className="flex items-center gap-1">
									<Button
										variant="outline"
										size="sm"
										className="size-7 h-7 w-7 p-0"
										onClick={decrementQuantity}
										disabled={quantity <= 1}
										title="Decrease quantity"
									>
										-
									</Button>

									<span className="w-8 text-center font-medium text-sm">
										{quantity}
									</span>

									<Button
										variant="outline"
										size="sm"
										className="size-7 h-7 w-7 p-0"
										onClick={incrementQuantity}
										title="Increase quantity"
									>
										+
									</Button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
