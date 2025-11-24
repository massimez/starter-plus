"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
	Heart,
	Minus,
	Plus,
	RotateCcw,
	Share2,
	Shield,
	ShoppingCart,
	Star,
	Truck,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { use, useMemo, useState } from "react";
import { toast } from "sonner";
import { FrequentlyBoughtTogether } from "@/components/features";
import {
	useDefaultLocation,
	useOrganization,
	useProduct,
} from "@/lib/hooks/use-storefront";
import { useCartStore } from "@/store/use-cart-store";

interface ProductPageProps {
	params: Promise<{ id: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
	const t = useTranslations("Product");
	const locale = useLocale();
	const { addItem } = useCartStore();
	const { id } = use(params);
	const [selectedVariantId, setSelectedVariantId] = useState<string>("");
	const [quantity, setQuantity] = useState(1);
	const [isWishlisted, setIsWishlisted] = useState(false);

	// Get organization info
	const { data: org, isLoading: isLoadingOrg } = useOrganization("yam");
	const organizationId = org?.id || "qGH0Uy2lnzoOfVeU6kcaLSuqfdKon8qe";

	// Get default location
	const { data: location, isLoading: isLoadingLocation } = useDefaultLocation(
		organizationId,
		!!organizationId,
	);

	// Get product data
	const { data: product, isLoading: isLoadingProduct } = useProduct(
		{
			organizationId,
			productId: id,
		},
		!!organizationId,
	);

	// Get the localized translation
	const translation =
		product?.translations?.find((t) => t.languageCode === locale) ||
		product?.translations?.find((t) => t.languageCode === "en");

	// Process product data
	const productData = useMemo(() => {
		if (!product) return null;

		let selectedVariant: (typeof product.variants)[number] | null = null;
		if (product?.variants && product.variants.length > 0) {
			const found = product.variants.find((v) => v.id === selectedVariantId);
			selectedVariant = (
				selectedVariantId && found ? found! : product.variants[0]!
			) as (typeof product.variants)[number] | null;
		}

		return {
			id: product.id,
			name: translation?.name || product.name || "Unnamed Product",
			price: selectedVariant ? Number.parseFloat(selectedVariant.price) : 0,
			compareAtPrice: selectedVariant?.compareAtPrice
				? Number.parseFloat(selectedVariant.compareAtPrice)
				: undefined,
			description: translation?.description || "",
			shortDescription: translation?.shortDescription || "",
			image:
				product.thumbnailImage?.url ||
				product.images?.[0]?.url ||
				"/placeholder-product.jpg",
			category: "General", // TODO: Get category from collections
			rating: 4.5, // TODO: Get from reviews
			reviewsCount: 0, // TODO: Get from reviews
			inStock: true, // TODO: Implement stock checking
			stockQuantity: 10, // TODO: Implement proper stock
			isOnSale: selectedVariant?.compareAtPrice
				? Number.parseFloat(selectedVariant.compareAtPrice) >
					Number.parseFloat(selectedVariant.price)
				: false,
			discountPercentage: selectedVariant?.compareAtPrice
				? Math.round(
						(1 -
							Number.parseFloat(selectedVariant.price) /
								Number.parseFloat(selectedVariant.compareAtPrice)) *
							100,
					)
				: 0,
			specifications: Object.entries(translation?.specifications || {}).map(
				([key, value]) => `${key}: ${value}`,
			),
			variants: product.variants || [],
			selectedVariant,
		};
	}, [product, translation, selectedVariantId]);

	// Set initial variant if not set and variants exist
	if (
		product?.variants &&
		!selectedVariantId &&
		product.variants.length > 0 &&
		product.variants[0]
	) {
		setSelectedVariantId(product.variants[0].id);
	}

	const handleAddToCart = () => {
		const cartItem = {
			id: productData!.id,
			name: productData!.name,
			price: productData!.price,
			quantity,
			description: productData!.description,
			image: productData!.image,
			productVariantId: productData!.selectedVariant?.id || "",
			locationId: location?.id || "",
		};

		addItem(cartItem);
		toast.success(
			`${quantity}x ${productData!.name} has been added to your cart!`,
		);
	};

	const handleQuantityChange = (newQuantity: number) => {
		if (newQuantity >= 1 && newQuantity <= productData!.stockQuantity) {
			setQuantity(newQuantity);
		}
	};

	const handleShare = () => {
		if (navigator.share) {
			navigator.share({
				title: productData?.name || "Product",
				text: productData?.description || "Check out this product!",
				url: window.location.href,
			});
		} else {
			navigator.clipboard.writeText(window.location.href);
			toast.success("Product link copied!");
		}
	};

	// Loading state
	if (isLoadingOrg || isLoadingProduct || !productData) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-32 w-32 animate-spin rounded-full border-violet-500 border-t-2 border-b-2" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-linear-to-br from-background to-muted/20">
			{/* Mobile-Optimized Container */}
			<div className="container mx-auto max-w-6xl px-3 py-6 sm:px-4 md:py-12">
				<div className="md:flex">
					{/* Product Image - Mobile First */}
					<div className="mb-6 md:mb-12 md:min-h-[400px] md:min-w-[400px]">
						<div className="relative w-full overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-muted/10 to-muted/30 shadow-xl md:rounded-3xl md:shadow-2xl">
							{productData.image ? (
								// biome-ignore lint/performance/noImgElement: <TODO>
								<img
									src={productData.image}
									alt={productData.name}
									className="h-auto w-full object-cover md:object-contain"
								/>
							) : (
								<div className="flex aspect-square w-full items-center justify-center md:aspect-video">
									<ShoppingCart className="h-16 w-16 text-muted-foreground/40 sm:h-20 sm:w-20" />
								</div>
							)}
						</div>

						{/* Sale Badge */}
						{productData.isOnSale && (
							<Badge className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs shadow-lg md:top-4 md:right-4 md:text-sm">
								-{productData.discountPercentage}%
							</Badge>
						)}
					</div>

					{/* Main Product Section */}
					<div className="md:ml-8 lg:ml-12">
						{/* Product Details */}
						<div className="flex flex-col justify-center space-y-6 md:space-y-8">
							{/* Title & Category */}
							<div className="space-y-2">
								<Badge variant="secondary" className="w-fit text-xs md:text-sm">
									{productData.category}
								</Badge>
								<h1 className="font-bold text-xl leading-tight tracking-tight md:text-4xl lg:text-5xl">
									{productData.name}
								</h1>
							</div>

							{/* Rating */}
							<div className="flex items-center space-x-3">
								<div className="flex items-center">
									{[...Array(5)].map((_, i) => (
										<Star
											// biome-ignore lint/suspicious/noArrayIndexKey: <>
											key={`star-${i}`}
											className={`h-5 w-5 ${
												i < Math.floor(productData.rating)
													? "fill-yellow-400 text-yellow-400"
													: "text-muted-foreground/50"
											}`}
										/>
									))}
								</div>
								<span className="font-medium">{productData.rating}</span>
								<span className="text-muted-foreground">
									({productData.reviewsCount} reviews)
								</span>
							</div>

							{/* Pricing */}
							<div className="space-y-3">
								<div className="flex items-baseline space-x-3">
									<span className="font-bold text-3xl text-primary md:text-4xl">
										${productData.price.toFixed(2)}
									</span>
									{productData.isOnSale && productData.compareAtPrice && (
										<span className="text-lg text-muted-foreground line-through md:text-xl">
											${productData.compareAtPrice.toFixed(2)}
										</span>
									)}
								</div>
								{productData.isOnSale && productData.compareAtPrice && (
									<Badge
										variant="outline"
										className="border-green-200 text-green-600"
									>
										Save $
										{(productData.compareAtPrice - productData.price).toFixed(
											2,
										)}
									</Badge>
								)}
							</div>

							{/* Description */}
							<p className="text-base text-muted-foreground leading-relaxed md:text-lg">
								{productData.shortDescription}
							</p>

							{/* Stock Status */}
							<div className="flex items-center space-x-2 text-sm">
								<div className="h-2 w-2 rounded-full bg-green-500" />
								<span className="font-medium text-green-600">
									In Stock ({productData.stockQuantity} available)
								</span>
							</div>

							{/* Variants Selector - Show only if more than 2 variants */}
							{productData.variants.length > 2 && (
								<div className="space-y-3">
									<span className="font-medium">Options</span>
									<div className="grid grid-cols-3 gap-2">
										{productData.variants.map((variant) => {
											const variantTranslation =
												variant.translations?.find(
													(t) => t.languageCode === locale,
												) ||
												variant.translations?.find(
													(t) => t.languageCode === "en",
												);

											return (
												<Button
													key={variant.id}
													variant={
														selectedVariantId === variant.id
															? "primary"
															: "outline"
													}
													onClick={() => setSelectedVariantId(variant.id)}
													className="w-full"
												>
													{variantTranslation?.name || variant.sku}
												</Button>
											);
										})}
									</div>
								</div>
							)}

							{/* Quantity & Actions */}
							<div className="space-y-6">
								{/* Quantity Selector */}
								<div className="flex items-center space-x-4">
									<span className="font-medium">Quantity</span>
									<div className="flex items-center rounded-full border bg-background shadow-sm">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleQuantityChange(quantity - 1)}
											disabled={quantity <= 1}
											className="h-10 w-10 rounded-full hover:bg-muted"
										>
											<Minus className="h-4 w-4" />
										</Button>
										<span className="px-4 py-2 font-medium">{quantity}</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleQuantityChange(quantity + 1)}
											disabled={quantity >= productData.stockQuantity}
											className="h-10 w-10 rounded-full hover:bg-muted"
										>
											<Plus className="h-4 w-4" />
										</Button>
									</div>
								</div>

								{/* Action Buttons - Mobile Optimized */}
								<div className="space-y-3">
									<Button
										size="lg"
										onClick={handleAddToCart}
										className="h-12 w-full rounded-full text-sm shadow-lg"
									>
										<ShoppingCart className="mr-2 h-5 w-5" />
										{t("addToCart")}
									</Button>

									{/* Secondary Actions Row */}
									<div className="grid grid-cols-3 gap-3">
										<Button
											variant="outline"
											size="md"
											onClick={() => setIsWishlisted(!isWishlisted)}
											className={`flex h-12 flex-col items-center justify-center space-y-1 rounded-full border-muted-foreground/20 text-xs ${
												isWishlisted
													? "border-red-200 bg-red-50 text-red-600"
													: "hover:bg-muted"
											}`}
										>
											<Heart
												className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`}
											/>
											<span className="hidden sm:inline">Wishlist</span>
										</Button>
										<Button
											variant="outline"
											size="md"
											onClick={handleShare}
											className="flex h-12 flex-col items-center justify-center space-y-1 rounded-full border-muted-foreground/20 text-xs hover:bg-muted"
										>
											<Share2 className="h-4 w-4" />
											<span className="hidden sm:inline">Share</span>
										</Button>
										<Button
											variant="outline"
											size="md"
											className="flex h-12 flex-col items-center justify-center space-y-1 rounded-full border-muted-foreground/20 text-xs hover:bg-muted"
										>
											<Shield className="h-4 w-4" />
											<span className="hidden sm:inline">Support</span>
										</Button>
									</div>
								</div>
							</div>

							{/* Trust Indicators - Mobile Optimized */}
							<div className="grid grid-cols-3 gap-4 pt-6 text-center md:pt-8">
								<div className="flex flex-col items-center space-y-2">
									<div className="rounded-full bg-muted/50 p-2">
										<Shield className="h-5 w-5" />
									</div>
									<span className="font-medium text-muted-foreground text-xs md:text-sm">
										Secure Purchase
									</span>
								</div>
								<div className="flex flex-col items-center space-y-2">
									<div className="rounded-full bg-muted/50 p-2">
										<Truck className="h-5 w-5" />
									</div>
									<span className="font-medium text-muted-foreground text-xs md:text-sm">
										Free Shipping
									</span>
								</div>
								<div className="flex flex-col items-center space-y-2">
									<div className="rounded-full bg-muted/50 p-2">
										<RotateCcw className="h-5 w-5" />
									</div>
									<span className="font-medium text-muted-foreground text-xs md:text-sm">
										Easy Returns
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Description - Mobile Optimized */}
				<div className="mt-12 md:mt-16">
					<Card className="border-border/50 shadow-sm">
						<CardContent className="p-4 md:p-8">
							<h2 className="mb-4 font-semibold text-xl md:mb-6 md:text-2xl">
								Description
							</h2>
							<div className="text-base text-muted-foreground leading-relaxed md:text-lg">
								{productData.description}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Frequently Bought Together - Mobile Optimized */}
				<div className="mt-12 md:mt-16">
					<FrequentlyBoughtTogether currentProductId={id} />
				</div>
			</div>
		</div>
	);
}
