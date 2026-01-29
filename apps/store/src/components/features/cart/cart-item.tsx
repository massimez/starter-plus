"use client";

import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { useFormatPrice } from "@/lib/hooks/use-format-price";
import { useCartStore } from "@/store/use-cart-store";

interface CartItem {
	id: string;
	name: string;
	price: number;
	quantity: number;
	image?: string;
	description?: string;
	variantName?: string;
	variantSku?: string;
}

interface CartItemProps {
	item: CartItem;
}

export function CartItem({ item }: CartItemProps) {
	const t = useTranslations("Cart");
	const { updateQuantity, removeItem } = useCartStore();
	const { formatPrice } = useFormatPrice();
	const quantity = item.quantity;

	const handleQuantityChange = (newQuantity: number) => {
		if (newQuantity === 0) {
			removeItem(item.id);
			return;
		}

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
		<Card className="overflow-hidden py-3 shadow-none">
			<CardContent className="p-1">
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
								{(item.variantName || item.variantSku) && (
									<p className="mt-0.5 text-muted-foreground text-xs">
										{item.variantName && <span>{item.variantName}</span>}
										{item.variantName && item.variantSku && <span> • </span>}
										{item.variantSku && <span>SKU: {item.variantSku}</span>}
									</p>
								)}

								<div className="mt-3 flex items-center justify-between">
									<p className="font-semibold text-sm">
										{formatPrice(totalPrice)}
									</p>
									<p className="text-[9px] text-muted-foreground">
										{formatPrice(item.price)} each
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

									<span className="w-6 text-center font-medium text-sm">
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
