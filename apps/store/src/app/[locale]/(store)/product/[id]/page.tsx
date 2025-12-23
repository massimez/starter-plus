"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Badge } from "@workspace/ui/components/badge";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
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
	RotateCcw,
	Share2,
	Shield,
	ShoppingCart,
	Star,
	Truck,
} from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { use, useMemo, useState } from "react";
import { toast } from "sonner";
import { FrequentlyBoughtTogether } from "@/components/features";
import {
	useDefaultLocation,
	useOrganization,
	useProduct,
} from "@/lib/hooks/use-storefront";
import type { ProductVariant } from "@/lib/storefront-types";
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
	const { data: location } = useDefaultLocation(
		organizationId,
		!!organizationId,
	);

	// Get product data with stock information
	const { data: product, isLoading: isLoadingProduct } = useProduct(
		{
			organizationId,
			productId: id,
			locationId: location?.id,
		},
		!!organizationId && !!location?.id,
	);

	// Get the localized translation
	const translation =
		product?.translations?.find((t) => t.languageCode === locale) ||
		product?.translations?.find((t) => t.languageCode === "en");

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
			category: "General", // TODO: Get category from collections
			rating: 4.5, // TODO: Get from reviews
			reviewsCount: 0, // TODO: Get from reviews
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

	const handleAddToCart = () => {
		// Validate that we have a selected variant
		if (!productData?.selectedVariant?.id) {
			toast.error("Please select a product variant");
			return;
		}

		// Validate that we have a location
		if (!location?.id) {
			toast.error("Unable to add to cart. Location not available.");
			return;
		}

		// Check stock availability
		const availableStock = productData.stockQuantity;
		const allowBackorders = productData.allowBackorders;

		if (availableStock <= 0 && !allowBackorders) {
			toast.error(
				`${productData.name} is currently out of stock and backorders are not allowed.`,
			);
			return;
		}

		if (quantity > availableStock && !allowBackorders) {
			toast.error(
				`Only ${availableStock} units available. Backorders are not allowed.`,
			);
			return;
		}

		// Get variant translation for name
		const variantTranslation =
			productData.selectedVariant.translations?.find(
				(t) => t.languageCode === locale,
			) ||
			productData.selectedVariant.translations?.find(
				(t) => t.languageCode === "en",
			);

		const cartItem = {
			id: productData.selectedVariant.id, // Use variant ID as unique identifier
			name: productData.name,
			price: productData.price,
			quantity,
			description: productData.description,
			image: productData.image,
			productVariantId: productData.selectedVariant.id,
			locationId: location.id,
			variantName: variantTranslation?.name,
			variantSku: productData.selectedVariant.sku,
		};

		addItem(cartItem);
		toast.success(
			`${quantity}x ${productData.name} has been added to your cart!`,
		);
	};

	const handleQuantityChange = (newQuantity: number) => {
		if (!productData || newQuantity < 1) return;
		if (
			productData.allowBackorders ||
			newQuantity <= productData.stockQuantity
		) {
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
		<div className="min-h-screen">
			<div className="grid gap-3 lg:grid-cols-2 lg:gap-8">
				{/* Left Column: Images */}
				<div className="space-y-6">
					<div className="relative overflow-hidden rounded-3xl border bg-muted/5 shadow-sm">
						<Carousel className="w-full">
							<CarouselContent>
								{productData.images.map((image, index) => (
									<CarouselItem key={image}>
										<div className="relative flex aspect-square items-center justify-center overflow-hidden bg-white p-2 md:aspect-4/3 md:p-8">
											<Image
												src={image}
												alt={`${productData.name} - View ${index + 1}`}
												fill
												className="object-contain transition-transform duration-500 hover:scale-105"
											/>
										</div>
									</CarouselItem>
								))}
							</CarouselContent>
							{productData.images.length > 1 && (
								<>
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

					{/* Thumbnails (Optional - could be added here) */}
				</div>

				{/* Right Column: Product Details (Sticky) */}
				<div className="flex flex-col space-y-8 lg:sticky lg:top-20 lg:h-fit">
					{/* Header */}
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							{productData.stockQuantity < 5 &&
								productData.stockQuantity > 0 && (
									<span className="animate-pulse font-medium text-red-500 text-xs">
										Only {productData.stockQuantity} left!
									</span>
								)}
						</div>

						<h1 className="font-bold text-2xl text-foreground tracking-tight md:text-4xl lg:text-5xl">
							{productData.name}
						</h1>

						<div className="flex items-center gap-4">
							<div className="flex items-center gap-1">
								{[1, 2, 3, 4, 5].map((star) => (
									<Star
										key={star}
										className={`h-5 w-5 ${
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

					<Separator />

					{/* Price */}
					<div className="flex items-baseline gap-3">
						<span className="font-bold text-3xl text-foreground md:text-4xl">
							{productData.price.toFixed(2)}
						</span>
						{productData.isOnSale && productData.compareAtPrice && (
							<>
								<span className="text-muted-foreground text-xl line-through decoration-red-500/50">
									${productData.compareAtPrice.toFixed(2)}
								</span>
								<Badge
									variant="outline"
									className="border-green-500 bg-green-50 text-green-600"
								>
									Save $
									{(productData.compareAtPrice - productData.price).toFixed(2)}
								</Badge>
							</>
						)}
					</div>

					{/* Short Description */}
					<p className="text-base text-muted-foreground leading-relaxed md:text-lg">
						{productData.shortDescription}
					</p>

					{/* Variants */}
					{productData.variants.length > 0 && (
						<div className="space-y-4">
							<span className="font-medium text-foreground text-sm">
								Select Option
							</span>
							<div className="flex flex-wrap gap-3">
								{productData.variants.map((variant) => {
									const variantTranslation =
										variant.translations?.find(
											(t) => t.languageCode === locale,
										) ||
										variant.translations?.find((t) => t.languageCode === "en");
									const isSelected = selectedVariantId === variant.id;

									return (
										<button
											key={variant.id}
											type="button"
											onClick={() => setSelectedVariantId(variant.id)}
											className={`relative min-w-16 rounded-xl border-2 px-4 py-2 font-medium text-sm transition-all ${
												isSelected
													? "border-primary bg-primary/5 text-primary"
													: "border-muted bg-transparent hover:border-muted-foreground/50"
											}`}
										>
											{variantTranslation?.name || variant.sku}
											{isSelected && (
												<div className="-top-2 -right-2 absolute rounded-full bg-primary p-0.5 text-white shadow-sm">
													<Check className="h-3 w-3" />
												</div>
											)}
										</button>
									);
								})}
							</div>
						</div>
					)}

					{/* Actions */}
					<div className="space-y-6 pt-4">
						<div className="flex flex-col flex-wrap gap-4 sm:flex-row">
							{/* Quantity */}
							<div className="hidden w-fit items-center rounded-full border bg-background p-1 shadow-sm sm:flex">
								<Button
									variant="ghost"
									size="icon"
									onClick={() => handleQuantityChange(quantity - 1)}
									disabled={quantity <= 1}
									className="h-10 w-10 rounded-full hover:bg-muted"
								>
									<Minus className="h-4 w-4" />
								</Button>
								<span className="w-12 text-center font-medium">{quantity}</span>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => handleQuantityChange(quantity + 1)}
									disabled={
										!productData.allowBackorders &&
										quantity >= productData.stockQuantity
									}
									className="h-10 w-10 rounded-full hover:bg-muted"
								>
									<Plus className="h-4 w-4" />
								</Button>
							</div>

							{/* Add to Cart */}
							<Button
								size="lg"
								onClick={handleAddToCart}
								disabled={
									!productData.inStock ||
									(productData.stockQuantity <= 0 &&
										!productData.allowBackorders)
								}
								className="hover:-translate-y-0.5 hidden h-12 flex-1 rounded-full py-2 text-base shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-50 sm:flex"
							>
								<ShoppingCart className="mr-2 size-5" />
								{productData.stockQuantity <= 0 && !productData.allowBackorders
									? "Out of Stock"
									: t("addToCart")}
							</Button>

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

					<Separator />
				</div>
			</div>
			<div>
				{/* Accordion Info */}
				<Accordion type="single" collapsible className="w-full">
					<AccordionItem value="description">
						<AccordionTrigger className="font-semibold text-base">
							Description
						</AccordionTrigger>
						<AccordionContent>
							<div className="prose prose-sm max-w-none text-muted-foreground">
								<p>{productData.description}</p>
							</div>
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="shipping">
						<AccordionTrigger className="font-semibold text-base">
							Shipping & Returns
						</AccordionTrigger>
						<AccordionContent>
							<div className="space-y-4 text-muted-foreground text-sm">
								<div className="flex items-start gap-3">
									<Truck className="h-5 w-5 shrink-0 text-primary" />
									<div>
										<p className="font-medium text-foreground">Free Shipping</p>
										<p>On all orders over $50. Arrives in 3-5 business days.</p>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<RotateCcw className="h-5 w-5 shrink-0 text-primary" />
									<div>
										<p className="font-medium text-foreground">Easy Returns</p>
										<p>30-day return policy. No questions asked.</p>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<Shield className="h-5 w-5 shrink-0 text-primary" />
									<div>
										<p className="font-medium text-foreground">
											Secure Checkout
										</p>
										<p>SSL encrypted checkout for your peace of mind.</p>
									</div>
								</div>
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>
			{/* Frequently Bought Together */}
			<FrequentlyBoughtTogether currentProductId={id} />

			{/* Mobile Sticky Add to Cart */}
			<div className="fixed right-0 bottom-0 left-0 z-50 border-t bg-background/95 p-4 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] backdrop-blur-md lg:hidden">
				<div className="flex items-center gap-4">
					<div className="hidden flex-col sm:flex">
						<span className="text-muted-foreground text-xs">Total</span>
						<span className="font-bold text-xl">
							${(productData.price * quantity).toFixed(2)}
						</span>
					</div>

					{/* Quantity Selector */}
					<div className="flex w-fit items-center rounded-full border bg-background p-1 shadow-sm">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handleQuantityChange(quantity - 1)}
							disabled={quantity <= 1}
							className="h-8 w-8 rounded-full hover:bg-muted"
						>
							<Minus className="h-3 w-3" />
						</Button>
						<span className="w-8 text-center font-medium text-sm">
							{quantity}
						</span>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handleQuantityChange(quantity + 1)}
							disabled={
								!productData.allowBackorders &&
								quantity >= productData.stockQuantity
							}
							className="h-8 w-8 rounded-full hover:bg-muted"
						>
							<Plus className="h-3 w-3" />
						</Button>
					</div>

					<Button
						size="lg"
						onClick={handleAddToCart}
						disabled={
							!productData.inStock ||
							(productData.stockQuantity <= 0 && !productData.allowBackorders)
						}
						className="flex-1 rounded-full shadow-md disabled:cursor-not-allowed disabled:opacity-50"
					>
						<ShoppingCart className="mr-2 h-4 w-4" />
						{productData.stockQuantity <= 0 && !productData.allowBackorders
							? "Out of Stock"
							: t("addToCart")}
					</Button>
				</div>
			</div>
		</div>
	);
}
