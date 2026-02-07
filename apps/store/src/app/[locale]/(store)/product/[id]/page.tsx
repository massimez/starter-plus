"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Badge } from "@workspace/ui/components/badge";

import { Button } from "@workspace/ui/components/button";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@workspace/ui/components/carousel";
import { Separator } from "@workspace/ui/components/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import {
	Check,
	Heart,
	Minus,
	Plus,
	Share2,
	ShoppingCart,
	Star,
} from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { use, useMemo, useState } from "react";
import { toast } from "sonner";
import { useFormatPrice } from "@/lib/hooks/use-format-price";
import { useDefaultLocation, useProduct } from "@/lib/hooks/use-storefront";
import type { ProductVariant } from "@/lib/storefront-types";
import {
	getProductTranslation,
	getVariantTranslation,
} from "@/lib/storefront-types";
import { useCartStore } from "@/store/use-cart-store";

interface ProductPageProps {
	params: Promise<{ id: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
	const t = useTranslations("Product");
	const locale = useLocale();
	const { addItem, items, updateQuantity, removeItem } = useCartStore();
	const { formatPrice } = useFormatPrice();
	const { id } = use(params);
	const [selectedVariantId, setSelectedVariantId] = useState<string>("");
	const [isWishlisted, setIsWishlisted] = useState(false);

	// Get default location
	const { data: location } = useDefaultLocation();

	// Get product data with stock information
	const { data: product, isLoading: isLoadingProduct } = useProduct(
		{
			productId: id,
			locationId: location?.id,
		},
		!!location?.id,
	);

	// Get the localized translation
	const translation = getProductTranslation(product, locale);

	// Process product data
	const productData = useMemo(() => {
		if (!product) return null;

		let selectedVariant: ProductVariant | null = null;
		if (product?.variants && product.variants.length > 0) {
			const found = product.variants.find((v) => v.id === selectedVariantId);
			selectedVariant = (
				selectedVariantId && found ? found : product.variants[0]
			) as ProductVariant | null;
		}

		return {
			id: product.id,
			name: translation?.name || product.name || "Unnamed Product",
			price: selectedVariant
				? Number.parseFloat(String(selectedVariant.price))
				: 0,
			compareAtPrice: selectedVariant?.compareAtPrice
				? Number.parseFloat(String(selectedVariant.compareAtPrice))
				: undefined,
			description: translation?.description || "",
			shortDescription: translation?.shortDescription || "",
			image:
				product.thumbnailImage?.url ||
				product.images?.[0]?.url ||
				"/placeholder-product.jpg",
			images: product.images?.length
				? product.images.map((img) => img.url)
				: [
						product.thumbnailImage?.url ||
							product.images?.[0]?.url ||
							"/placeholder-product.jpg",
					],
			rating: 4.5, // TODO: Get from reviews
			reviewsCount: 1, // TODO: Get from reviews
			inStock: selectedVariant?.stock
				? selectedVariant.stock.availableQuantity > 0 || product.allowBackorders
				: true,
			stockQuantity: selectedVariant?.stock?.availableQuantity || 0,
			allowBackorders: product.allowBackorders || false,
			isOnSale: selectedVariant?.compareAtPrice
				? Number.parseFloat(String(selectedVariant.compareAtPrice)) >
					Number.parseFloat(String(selectedVariant.price))
				: false,
			discountPercentage: selectedVariant?.compareAtPrice
				? Math.round(
						(1 -
							Number.parseFloat(String(selectedVariant.price)) /
								Number.parseFloat(String(selectedVariant.compareAtPrice))) *
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

	// Get current quantity in cart for this variant
	const cartItem = items.find(
		(item) => item.productVariantId === productData?.selectedVariant?.id,
	);
	const cartQuantity = cartItem?.quantity || 0;

	const handleIncrement = () => {
		if (!productData?.selectedVariant?.id || !location?.id) return;

		const availableStock = productData.stockQuantity;
		const allowBackorders = productData.allowBackorders;
		const currentQty = cartQuantity;

		if (currentQty >= availableStock && !allowBackorders) {
			toast.error(
				`Only ${availableStock} units available. Backorders are not allowed.`,
			);
			return;
		}

		if (currentQty === 0) {
			// Add new item
			const variantTranslation = getVariantTranslation(
				productData.selectedVariant,
				locale,
			);

			addItem({
				id: productData.selectedVariant.id,
				name: productData.name,
				price: productData.price,
				quantity: 1,
				description: productData.description,
				image: productData.image,
				productVariantId: productData.selectedVariant.id,
				locationId: location.id,
				variantName: variantTranslation?.name,
				variantSku: productData.selectedVariant.sku,
			});
		} else {
			// Increment existing
			updateQuantity(productData.selectedVariant.id, currentQty + 1);
		}
	};

	const handleDecrement = () => {
		if (!productData?.selectedVariant?.id) return;

		if (cartQuantity <= 1) {
			removeItem(productData.selectedVariant.id);
		} else {
			updateQuantity(productData.selectedVariant.id, cartQuantity - 1);
		}
	};

	const handleShare = () => {
		if (navigator.share) {
			navigator.share({
				title: productData?.name || "Product",
				text: productData?.description || "Check out this product!",
				url: window.location.href,
			});
		} else if (navigator.clipboard) {
			navigator.clipboard.writeText(window.location.href);
			toast.success("Product link copied!");
		} else {
			toast.error("Sharing is not supported on this device");
		}
	};

	// Loading state
	if (isLoadingProduct || !productData) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-32 w-32 animate-spin rounded-full border-violet-500 border-t-2 border-b-2" />
			</div>
		);
	}

	return (
		<div className="min-h-screen pb-24 lg:pb-0">
			<div className="grid gap-0 lg:grid-cols-2 lg:gap-8">
				{/* Left Column: Images */}
				<div className="h-fit w-full space-y-6 lg:rounded-3xl lg:border lg:bg-muted/5 lg:p-0 lg:shadow-sm">
					<div className="relative w-full overflow-hidden">
						<Carousel className="w-full">
							<CarouselContent>
								{productData.images.map((image, index) => (
									<CarouselItem key={image}>
										<div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl bg-white lg:aspect-4/3 lg:p-8">
											<Image
												src={image}
												alt={`${productData.name} - View ${index + 1}`}
												fill
												className="object-cover transition-transform duration-500 hover:scale-105 lg:object-fill"
											/>
										</div>
									</CarouselItem>
								))}
							</CarouselContent>
							{productData.images.length > 1 && (
								<>
									<div className="absolute right-0 bottom-4 left-0 flex justify-center gap-2 lg:hidden">
										{productData.images.map((image) => (
											<div
												key={image}
												className="h-1.5 w-1.5 rounded-full bg-black/20 backdrop-blur-sm transition-all data-[active=true]:w-4 data-[active=true]:bg-black/60"
											/>
										))}
									</div>
									<CarouselPrevious className="left-4 hidden lg:flex" />
									<CarouselNext className="right-4 hidden lg:flex" />
								</>
							)}
						</Carousel>

						{/* Sale Badge */}
						{productData.isOnSale && (
							<Badge className="absolute top-4 left-4 z-10 bg-red-500 px-3 py-1 font-medium text-base text-white shadow-lg hover:bg-red-600">
								-{productData.discountPercentage}%
							</Badge>
						)}
					</div>
				</div>

				{/* Right Column: Product Details (Sticky) */}
				<div className="flex flex-col space-y-4 lg:sticky lg:top-20 lg:h-fit lg:space-y-6 lg:px-0">
					{/* Header */}
					<div className="fade-in slide-in-from-bottom-4 animate-in space-y-3 duration-500 lg:space-y-4">
						<div className="flex items-center gap-2">
							{productData.stockQuantity < 5 &&
								productData.stockQuantity > 0 && (
									<span className="flex animate-pulse items-center gap-1.5 font-medium text-red-500 text-xs">
										<span className="relative flex h-2 w-2">
											<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
											<span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
										</span>
										Only {productData.stockQuantity} left!
									</span>
								)}
						</div>

						<h1 className="font-bold text-2xl text-foreground leading-tight tracking-tight md:text-4xl lg:text-3xl 2xl:text-3xl">
							{productData.name}
						</h1>

						<div className="hidden items-center gap-4">
							<div className="flex items-center gap-0.5">
								{[1, 2, 3, 4, 5].map((star) => (
									<Star
										key={star}
										className={`h-4 w-4 ${
											star <= Math.floor(productData.rating)
												? "fill-yellow-400 text-yellow-400"
												: "text-muted-foreground/30"
										}`}
									/>
								))}
							</div>
							<span className="text-muted-foreground text-sm">
								{productData.rating} ({productData.reviewsCount} reviews)
							</span>
						</div>
					</div>

					{/* Mobile Separator only */}
					<div className="h-px w-full bg-border lg:hidden" />

					{/* Price */}
					<div className="fade-in slide-in-from-bottom-4 flex animate-in items-baseline gap-3 delay-100 duration-500">
						<span className="font-bold text-3xl text-foreground md:text-4xl">
							{formatPrice(productData.price)}
						</span>
						{productData.isOnSale && productData.compareAtPrice && (
							<>
								<span className="text-muted-foreground text-xl line-through decoration-red-500/50">
									{formatPrice(productData.compareAtPrice)}
								</span>
								<Badge
									variant="outline"
									className="border-green-500 bg-green-50 text-green-600"
								>
									Save{" "}
									{formatPrice(productData.compareAtPrice - productData.price)}
								</Badge>
							</>
						)}
					</div>

					<Separator className="hidden lg:block" />

					{/* Short Description */}
					<p className="fade-in slide-in-from-bottom-4 animate-in text-base text-muted-foreground leading-relaxed delay-150 duration-500 md:text-lg">
						{productData.shortDescription}
					</p>

					{/* Variants */}
					{productData.variants.length > 0 && (
						<div className="fade-in slide-in-from-bottom-4 animate-in space-y-4 delay-200 duration-500">
							<div className="flex flex-wrap gap-3">
								{productData.variants.map((variant) => {
									const variantTranslation = getVariantTranslation(
										variant,
										locale,
									);
									const isSelected = selectedVariantId === variant.id;

									return (
										<button
											key={variant.id}
											type="button"
											onClick={() => setSelectedVariantId(variant.id)}
											className={`relative min-w-18 rounded-xl border-2 px-4 py-2.5 font-medium text-sm transition-all active:scale-95 ${
												isSelected
													? "border-primary bg-primary/5 text-primary shadow-sm"
													: "border-muted bg-transparent hover:border-muted-foreground/50"
											}`}
										>
											{variantTranslation?.name || variant.sku}
											{isSelected && (
												<div className="-top-2 -right-2 absolute rounded-full bg-primary p-0.5 text-white shadow-sm ring-2 ring-background">
													<Check className="h-3 w-3" />
												</div>
											)}
										</button>
									);
								})}
							</div>
						</div>
					)}

					{/* Desktop Actions */}
					<div className="hidden space-y-6 pt-4 lg:block">
						<div className="flex flex-col flex-wrap gap-4 sm:flex-row">
							{cartQuantity === 0 ? (
								<Button
									size="lg"
									onClick={handleIncrement}
									disabled={
										!productData.inStock ||
										(productData.stockQuantity <= 0 &&
											!productData.allowBackorders)
									}
									className="hover:-translate-y-0.5 h-12 w-full rounded-full py-2 text-base shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:flex-1"
								>
									<ShoppingCart className="mr-2 size-5" />
									{productData.stockQuantity <= 0 &&
									!productData.allowBackorders
										? "Out of Stock"
										: t("addToCart")}
								</Button>
							) : (
								<div className="flex h-12 w-full items-center justify-between rounded-full border bg-muted/50 p-1 sm:w-auto sm:flex-1">
									<Button
										variant="ghost"
										size="icon"
										onClick={handleDecrement}
										className="h-10 w-10 rounded-full hover:bg-background hover:shadow-sm"
									>
										{cartQuantity === 1 ? (
											<Minus className="h-4 w-4 text-red-500" />
										) : (
											<Minus className="h-4 w-4" />
										)}
									</Button>
									<span className="flex min-w-8 items-center justify-center gap-1 px-2 text-center font-bold text-sm">
										<span className="text-lg">{cartQuantity}</span>
										<span className="text-muted-foreground">x</span>
										<span>{formatPrice(productData.price)}</span>
									</span>
									<Button
										variant="ghost"
										size="icon"
										onClick={handleIncrement}
										disabled={
											!productData.allowBackorders &&
											cartQuantity >= productData.stockQuantity
										}
										className="h-10 w-10 rounded-full hover:bg-background hover:shadow-sm"
									>
										<Plus className="h-4 w-4" />
									</Button>
								</div>
							)}

							{/* Wishlist & Share */}
							<div className="flex gap-2">
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="outline"
												size="icon"
												onClick={() => setIsWishlisted(!isWishlisted)}
												className={`h-12 w-12 rounded-full border-2 ${
													isWishlisted
														? "border-red-200 bg-red-50 text-red-500"
														: "hover:bg-muted"
												}`}
											>
												<Heart
													className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`}
												/>
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											<p>
												{isWishlisted
													? "Remove from Wishlist"
													: "Add to Wishlist"}
											</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>

								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="outline"
												size="icon"
												onClick={handleShare}
												className="h-12 w-12 rounded-full border-2 hover:bg-muted"
											>
												<Share2 className="h-5 w-5" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											<p>Share Product</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>
						</div>
					</div>

					<Separator className="hidden lg:block" />
				</div>
			</div>

			<div className="mt-8 lg:mt-0 lg:px-0">
				{/* Accordion Info */}
				<Accordion type="single" collapsible className="w-full">
					{productData.description && (
						<AccordionItem value="description" className="border-t border-b-0">
							<AccordionTrigger className="py-6 font-semibold text-lg">
								Description
							</AccordionTrigger>
							<AccordionContent>
								<div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
									<p>{productData.description}</p>
								</div>
							</AccordionContent>
						</AccordionItem>
					)}
					{/* <AccordionItem value="shipping" className="border-t">
						<AccordionTrigger className="py-6 font-semibold text-lg">
							Shipping & Returns
						</AccordionTrigger>
						<AccordionContent>
							<div className="space-y-6 text-muted-foreground text-sm">
								<div className="flex items-start gap-4">
									<div className="rounded-full bg-primary/10 p-2 text-primary">
										<Truck className="h-5 w-5 shrink-0" />
									</div>
									<div>
										<p className="font-semibold text-base text-foreground">
											Free Shipping
										</p>
										<p className="mt-1">
											On all orders over $50. Arrives in 3-5 business days.
										</p>
									</div>
								</div>
								<div className="flex items-start gap-4">
									<div className="rounded-full bg-primary/10 p-2 text-primary">
										<RotateCcw className="h-5 w-5 shrink-0" />
									</div>
									<div>
										<p className="font-semibold text-base text-foreground">
											Easy Returns
										</p>
										<p className="mt-1">
											30-day return policy. No questions asked.
										</p>
									</div>
								</div>
								<div className="flex items-start gap-4">
									<div className="rounded-full bg-primary/10 p-2 text-primary">
										<Shield className="h-5 w-5 shrink-0" />
									</div>
									<div>
										<p className="font-semibold text-base text-foreground">
											Secure Checkout
										</p>
										<p className="mt-1">
											SSL encrypted checkout for your peace of mind.
										</p>
									</div>
								</div>
							</div>
						</AccordionContent>
					</AccordionItem> */}
				</Accordion>
			</div>

			{/* Mobile Sticky Add to Cart */}
			{/* Mobile Sticky Add to Cart */}
			<div className="fixed right-0 bottom-0 left-0 z-50 border-t bg-background/80 p-4 pb-6 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] backdrop-blur-xl supports-backdrop-filter:bg-background/60 lg:hidden">
				<div className="flex items-center gap-4 pe-22">
					{cartQuantity === 0 ? (
						<Button
							size="lg"
							onClick={handleIncrement}
							disabled={
								!productData.inStock ||
								(productData.stockQuantity <= 0 && !productData.allowBackorders)
							}
							className="h-12 flex-1 rounded-full font-semibold text-base shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{productData.stockQuantity <= 0 &&
							!productData.allowBackorders ? (
								"Out of Stock"
							) : (
								<>
									<ShoppingCart className="mr-2 h-5 w-5" />
									Add to Cart
								</>
							)}
						</Button>
					) : (
						<div className="flex h-12 flex-1 items-center justify-between rounded-full border bg-muted/50 p-1">
							<Button
								variant="ghost"
								size="icon"
								onClick={handleDecrement}
								className="h-10 w-10 rounded-full hover:bg-background hover:shadow-sm"
							>
								{cartQuantity === 1 ? (
									<Minus className="h-4 w-4 text-red-500" />
								) : (
									<Minus className="h-4 w-4" />
								)}
							</Button>
							<span className="flex min-w-8 items-center justify-center gap-1 px-2 text-center font-bold text-sm">
								<span className="text-lg">{cartQuantity}</span>
								<span className="text-muted-foreground">x</span>
								<span>{formatPrice(productData.price)}</span>
							</span>
							<Button
								variant="ghost"
								size="icon"
								onClick={handleIncrement}
								disabled={
									!productData.allowBackorders &&
									cartQuantity >= productData.stockQuantity
								}
								className="h-10 w-10 rounded-full hover:bg-background hover:shadow-sm"
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
