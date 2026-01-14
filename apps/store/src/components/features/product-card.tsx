"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Minus, PlusIcon, ShoppingCart } from "lucide-react";

import Image from "next/image";
import { toast } from "sonner";
import { Link } from "@/i18n/routing";
import { useDefaultLocationId } from "@/lib/hooks/use-default-location";
import { useFormatPrice } from "@/lib/hooks/use-format-price";
import { useCartStore } from "@/store/use-cart-store";

export interface Product {
	id: string;
	name: string;
	price: number;
	category: string;
	description?: string;
	image?: string;
	rating?: number;
	reviews?: number;
	isNew?: boolean;
	isOnSale?: boolean;
	discountPercentage?: number;
	productVariantId?: string;
	variantName?: string;
	variantSku?: string;
}

interface ProductCardProps {
	product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
	const { items, addItem, removeItem, updateQuantity } = useCartStore();
	const { formatPrice } = useFormatPrice();
	const { locationId } = useDefaultLocationId();

	// Find the current quantity of this item in the cart
	// We need to match by productVariantId if available, or just rely on what's in the cart.
	// The cart store uses productVariantId as the identifier in addItem logic, but let's double check.
	// In use-cart-store.ts: existingItem check uses productVariantId.
	// So we should find based on that.
	const cartItem = items.find(
		(item) => item.productVariantId === product.productVariantId,
	);
	const quantity = cartItem?.quantity || 0;

	const handleAddToCart = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!locationId) {
			toast.error("Unable to add to cart. Location not available.");
			return;
		}

		if (!product.productVariantId) {
			toast.error(
				"This product is currently unavailable. Please try another variant or check back later.",
			);
			return;
		}

		const itemToAdd = {
			id: product.productVariantId,
			name: product.name,
			price: product.price,
			quantity: 1,
			description: product.description || `${product.category} product`,
			image: product.image,
			productVariantId: product.productVariantId,
			locationId: locationId,
			variantName: product.variantName,
			variantSku: product.variantSku,
		};

		addItem(itemToAdd);
		if (quantity === 0) {
			toast.success(`${product.name} has been added to your cart!`);
		}
	};

	const handleRemoveOne = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!cartItem) return;

		if (quantity > 1) {
			updateQuantity(cartItem.id, quantity - 1);
		} else {
			removeItem(cartItem.id);
		}
	};

	return (
		<Link href={`/product/${product.id}`} className="block h-full">
			<Card className="group relative flex h-full flex-col gap-0 overflow-hidden rounded-xl border-none bg-white py-0 shadow-none transition-all duration-300 hover:shadow-lg dark:bg-card">
				{/* Image Container */}
				<div className="relative aspect-square w-full overflow-hidden">
					<div className="relative h-full w-full overflow-hidden rounded-lg bg-muted/20">
						{product.image ? (
							<Image
								src={product.image}
								alt={product.name}
								fill
								sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
								className="object-contain transition-transform duration-300 group-hover:scale-105"
							/>
						) : (
							<div className="flex h-full items-center justify-center">
								<ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
							</div>
						)}

						{/* Quantity Overlay */}
						{quantity > 0 && (
							<div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 transition-opacity">
								<span
									key={quantity}
									className="slide-in-from-top-6 fade-in animate-in fill-mode-both font-bold text-4xl text-white drop-shadow-md duration-300"
								>
									{quantity}
								</span>
							</div>
						)}

						{/* Badges */}
						{product.discountPercentage && (
							<div className="absolute top-1 left-1 z-10">
								<Badge
									variant="destructive"
									className="h-auto min-w-0 rounded px-1 py-0.5 font-bold text-[9px] leading-none"
								>
									-{product.discountPercentage}%
								</Badge>
							</div>
						)}
					</div>
				</div>

				{/* Content */}
				<CardContent className="flex flex-1 flex-col px-2 pt-0 pb-2 text-left">
					<h3 className="mt-0.5 line-clamp-2 min-h-[2.4em] font-bold text-foreground text-xs leading-tight">
						{product.name}
					</h3>

					<p className="mt-0.5 font-medium text-[10px] text-muted-foreground leading-none">
						{product.variantName || "1 pc"}
					</p>

					{/** biome-ignore lint/a11y/noStaticElementInteractions: <> */}
					{/** biome-ignore lint/a11y/useKeyWithClickEvents: <> */}
					<div
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
						}}
						className="mt-3 flex items-center justify-between"
					>
						{/* Price Button Pill */}

						<div className="flex cursor-pointer items-center gap-2 rounded-full bg-primary/10 px-3 py-1 transition-colors hover:bg-primary/20 dark:bg-primary/30 dark:hover:bg-primary/50">
							{quantity > 0 && (
								<button onClick={handleRemoveOne}>
									<Minus className="h-4 w-4" />
								</button>
							)}
							<button onClick={handleAddToCart}>
								<span className="pt-0.5 font-bold text-foreground text-sm leading-none">
									{formatPrice(product.price)}
								</span>
							</button>

							<button onClick={handleAddToCart}>
								<PlusIcon className="size-5 text-primary" />
							</button>
						</div>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
