"use client";

import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@workspace/ui/components/carousel";
import { useLocale } from "next-intl";
import { ProductCard } from "@/components/features/product-card";
import { Link } from "@/i18n/routing";
import { useDefaultLocation, useProducts } from "@/lib/hooks/use-storefront";
import { cn } from "@/lib/utils";

interface SubcategoryRowProps {
	collectionId: string;
	title: string;
	slug: string;
	className?: string;
}

export function SubcategoryRow({
	collectionId,
	title,
	slug,
	className,
}: SubcategoryRowProps) {
	const { data: location } = useDefaultLocation();
	const locale = useLocale();

	const { data: products = [], isLoading } = useProducts(
		{
			collectionId,
			limit: 10,
			sort: "newest", // Default sort
			...(location?.id ? { locationId: location.id } : {}),
		},
		!!collectionId,
	);

	if (isLoading) {
		return <div className="h-96 w-full animate-pulse rounded-xl bg-muted/10" />;
	}

	if (products.length === 0) {
		return null;
	}

	// Map products to component format (reusing logic from products-view if shared, or inline here)
	const mappedProducts = products.map((p) => {
		const firstVariant = p.variants?.[0];
		const variantTranslation =
			firstVariant?.translations?.find(
				(t: { languageCode: string }) => t.languageCode === locale,
			) || firstVariant?.translations?.[0];

		return {
			id: p.id,
			name: p.translations?.find((t) => t.languageCode === locale)?.name || "",
			price: firstVariant
				? Number.parseFloat(firstVariant.price)
				: p.minPrice || 0,
			category: title,
			description: "", // Simplified
			image: p.thumbnailImage?.url,
			rating: 4.5,
			reviews: 0,
			isNew:
				new Date(p.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000,
			productVariantId: firstVariant?.id,
			variantName: variantTranslation?.name,
			variantSku: firstVariant?.sku,
			variants: p.variants,
		};
	});

	return (
		<section className={cn("space-y-6", className)}>
			<div className="flex items-center justify-between">
				<Link href={`/category/${slug}`}>
					<h2 className="font-bold text-2xl">{title}</h2>
				</Link>
			</div>

			<Carousel
				opts={{
					align: "start",
					loop: true,
				}}
				className="w-full"
			>
				<CarouselContent className="-ml-4 pb-4">
					{mappedProducts.map((product) => (
						<CarouselItem
							key={product.id}
							className="basis-[260px] ps-4 md:basis-[280px]"
						>
							<ProductCard product={product} />
						</CarouselItem>
					))}
				</CarouselContent>
				<CarouselPrevious className="-start-4 hidden md:flex" />
				<CarouselNext className="-end-4 hidden md:flex" />
			</Carousel>
		</section>
	);
}
