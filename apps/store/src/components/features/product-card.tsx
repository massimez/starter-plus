"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link } from "@/i18n/routing";
import { useDefaultLocationId } from "@/lib/hooks/use-default-location";
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
}

interface ProductCardProps {
	product: Product;
	showAddToCart?: boolean;
	showViewDetails?: boolean;
	showWishlist?: boolean;
	compact?: boolean;
}

export function ProductCard({
	product,
	showAddToCart = true,
	showWishlist = false,
	compact = false,
}: ProductCardProps) {
	const t = useTranslations("Product");
	const { addItem } = useCartStore();
	const { locationId } = useDefaultLocationId();

	const handleAddToCart = () => {
		if (!locationId) {
			toast.error("Unable to add to cart. Location not available.");
			return;
		}

		const cartItem = {
			id: product.id,
			name: product.name,
			price: product.price,
			quantity: 1,
			description: product.description || `${product.category} product`,
			image: product.image,
			productVariantId: product.id, // Using product ID as variant ID for now
			locationId: locationId,
		};

		addItem(cartItem);
		toast.success(`${product.name} has been added to your cart!`);
	};

	return (
		<Card className="group hover:-translate-y-1 relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-lg">
			<CardHeader className="p-2 sm:p-4">
				<Link href={`/product/${product.id}`}>
					<CardTitle
						className={`${compact ? "text-base sm:text-lg" : "text-lg sm:text-xl"} line-clamp-1 cursor-pointer transition-colors group-hover:text-primary`}
					>
						{product.name}
					</CardTitle>
				</Link>
				<Link
					href={`/categories/${product.category.toLowerCase().replace(" ", "-")}`}
				>
					<Badge
						variant="outline"
						className="w-fit cursor-pointer text-xs transition-colors hover:bg-primary hover:text-primary-foreground sm:text-sm"
					>
						{product.category}
					</Badge>
				</Link>
			</CardHeader>

			<CardContent className="flex flex-1 flex-col p-2 pt-0 sm:p-4 sm:pt-0">
				{/* Product Image */}
				<div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg bg-muted/30">
					{product.image ? (
						// biome-ignore lint/performance/noImgElement: <TODO>
						<img
							src={product.image}
							alt={product.name}
							className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
						/>
					) : (
						<div className="flex h-full items-center justify-center bg-linear-to-br from-muted/20 to-muted/40">
							<ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
						</div>
					)}

					{/* Product Badges */}
					{product.isNew || product.isOnSale ? (
						<div className="absolute right-2 bottom-2 z-10 flex flex-col gap-1">
							{product.isNew && (
								<div className="rounded backdrop-blur-sm">
									<Badge variant="info" className="px-2 py-1">
										New
									</Badge>
								</div>
							)}
							{product.isOnSale && product.discountPercentage && (
								<div className="rounded backdrop-blur-sm">
									<Badge variant="destructive" className="px-2 py-1">
										-{product.discountPercentage}%
									</Badge>
								</div>
							)}
						</div>
					) : null}

					{/* Wishlist Button */}
					{showWishlist && (
						<Button
							variant="ghost"
							size="sm"
							className="absolute top-2 right-2 z-10 h-9 w-9 p-0 backdrop-blur-sm hover:bg-black/80 sm:h-8 sm:w-8"
							onClick={(e) => {
								e.preventDefault();
								toast.success(`Added ${product.name} to wishlist!`);
							}}
						>
							<Heart className="size-4 text-white" />
						</Button>
					)}

					{/* Rating - overlaid on image */}
					{product.rating && (
						<div className="absolute bottom-2 left-2 z-10 sm:left-3">
							<div className="flex items-center gap-1 rounded bg-black/30 px-2 py-1 backdrop-blur-sm">
								<Star className="h-3 w-3 text-yellow-400" />
								<span className="font-medium text-white text-xs">
									{product.rating.toFixed(1)}
								</span>
								<span className="hidden font-medium text-white/70 text-xs sm:inline">
									({product.reviews || 0})
								</span>
							</div>
						</div>
					)}
				</div>

				{/* Product Description - Fixed height */}
				{product.description && !compact && (
					<p className="mb-3 line-clamp-2 text-muted-foreground text-sm">
						{product.description}
					</p>
				)}

				{/* Spacer to push price to bottom */}
				<div className="flex-1" />

				{/* Product Price */}
				<div className="flex flex-wrap items-center gap-2">
					{product.isOnSale && product.discountPercentage ? (
						<div className="flex flex-wrap items-center gap-2">
							<span className="font-bold text-green-600 text-lg sm:text-lg">
								$
								{(
									(product.price * (100 - product.discountPercentage)) /
									100
								).toFixed(2)}
							</span>
							<span className="text-muted-foreground text-sm line-through">
								${product.price.toFixed(2)}
							</span>
						</div>
					) : (
						<span className="font-bold text-xl sm:text-xl">
							${product.price.toFixed(2)}
						</span>
					)}
				</div>
			</CardContent>

			{!compact && (
				<CardFooter className="flex flex-col gap-2 p-2 pt-0 sm:p-4 sm:pt-0">
					{showAddToCart && (
						<Button
							onClick={handleAddToCart}
							className="min-h-11 w-full transition-colors group-hover:bg-primary/90 sm:min-h-10"
						>
							<ShoppingCart className="mr-2 h-4 w-4" />
							{t("addToCart")}
						</Button>
					)}
				</CardFooter>
			)}
		</Card>
	);
}
