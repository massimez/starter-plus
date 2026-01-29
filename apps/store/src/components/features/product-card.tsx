"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";

import { Minus, PlusIcon, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "@/i18n/routing";
import { useDefaultLocationId } from "@/lib/hooks/use-default-location";
import { useFormatPrice } from "@/lib/hooks/use-format-price";
import type { ProductVariant } from "@/lib/storefront-types";
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
	variants?: ProductVariant[];
}

interface ProductCardProps {
	product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
	const { items, addItem, removeItem, updateQuantity } = useCartStore();
	const { formatPrice } = useFormatPrice();
	const { locationId } = useDefaultLocationId();
	const t = useTranslations("ProductCard");

	const [selectedVariantId, setSelectedVariantId] = useState<
		string | undefined
	>(product.productVariantId);

	const selectedVariant = product.variants?.find(
		(v) => v.id === selectedVariantId,
	);

	// If we have a selected variant from the list, use its details, otherwise fall back to the top-level product props
	const currentPrice = selectedVariant
		? Number(selectedVariant.price)
		: product.price;

	const currentVariantName = selectedVariant
		? selectedVariant.translations?.find((t) => t.languageCode === "en")
				?.name || selectedVariant.sku
		: product.variantName;

	// Find the current quantity of this item in the cart
	const cartItem = items.find(
		(item) =>
			item.productVariantId === (selectedVariantId || product.productVariantId),
	);
	const quantity = cartItem?.quantity || 0;

	const handleAddToCart = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!locationId) {
			toast.error(t("addToCartErrorLocation"));
			return;
		}

		const variantIdToAdd = selectedVariantId || product.productVariantId;

		if (!variantIdToAdd) {
			toast.error(t("addToCartErrorUnavailable"));
			return;
		}

		const itemToAdd = {
			id: variantIdToAdd,
			name: product.name,
			price: currentPrice,
			quantity: 1,
			description:
				product.description ||
				t("descriptionDefault", { category: product.category }),
			image: product.image,
			productVariantId: variantIdToAdd,
			locationId: locationId,
			variantName: currentVariantName,
			variantSku: selectedVariant?.sku || product.variantSku,
		};

		addItem(itemToAdd);
		if (quantity === 0) {
			toast.success(t("addToCartSuccess", { name: product.name }));
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
		<Card className="group relative flex h-full flex-col gap-0 overflow-hidden rounded-xl border-none bg-white py-0 shadow-none transition-all duration-300 hover:shadow-lg dark:bg-card">
			<Link
				href={`/product/${product.id}`}
				className="absolute inset-0 z-0"
				aria-label={`View ${product.name}`}
			/>
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
				<h3 className="mt-0.5 mb-1 line-clamp-2 font-bold text-foreground text-xs leading-tight">
					{product.name}
				</h3>

				<div className="h-8">
					{product.variants && product.variants.length > 1 ? (
						<div className="relative z-10 flex items-center gap-1 pt-2">
							{product.variants.slice(0, 3).map((v) => {
								const name =
									v.translations?.find((t) => t.languageCode === "en")?.name ||
									v.sku;
								const isSelected = v.id === selectedVariantId;
								return (
									<Badge
										key={v.id}
										variant={isSelected ? "primary" : "outline"}
										className="max-w-20 cursor-pointer hover:bg-primary/90 hover:text-primary-foreground"
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											setSelectedVariantId(v.id);
										}}
									>
										<span className="truncate">{name}</span>
									</Badge>
								);
							})}
							{product.variants.length > 3 && (
								<Link
									href={`/product/${product.id}`}
									className="flex items-center no-underline"
									onClick={(e) => e.stopPropagation()}
								>
									<Badge
										variant="outline"
										className="cursor-pointer hover:bg-primary/90 hover:text-primary-foreground"
									>
										+{product.variants.length - 3}
									</Badge>
								</Link>
							)}
						</div>
					) : (
						<p className="font-medium text-[10px] text-muted-foreground leading-none">
							{currentVariantName || ""}
						</p>
					)}
				</div>

				{/* Price Row */}
				<div className="pointer-events-none relative z-10 mt-3 flex items-center justify-between">
					{/* Price Button Pill */}
					<div className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full bg-primary/10 px-3 py-1 transition-colors hover:bg-primary/20 dark:bg-primary/30 dark:hover:bg-primary/50">
						{quantity > 0 && (
							<button onClick={handleRemoveOne}>
								<Minus className="h-4 w-4" />
							</button>
						)}
						<button onClick={handleAddToCart}>
							<span className="pt-0.5 font-bold text-foreground text-sm leading-none">
								{formatPrice(currentPrice)}
							</span>
						</button>

						<button onClick={handleAddToCart}>
							<PlusIcon className="size-5 text-primary" />
						</button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
