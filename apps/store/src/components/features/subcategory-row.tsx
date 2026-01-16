"use client";

import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@workspace/ui/components/carousel";

import { ProductCard } from "@/components/features/product-card";
import { Link } from "@/i18n/routing";
import {
	useDefaultLocation,
	useOrganization,
	useProducts,
} from "@/lib/hooks/use-storefront";
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
	// Fetch organization to be safe, though usually provided by parent context
	const { data: org } = useOrganization("yam"); // Or pass from parent
	const organizationId =
		org?.id || process.env.NEXT_PUBLIC_ORGANIZATION_ID || "";

	const { data: location } = useDefaultLocation(
		organizationId,
		!!organizationId,
	);

	const { data: products = [], isLoading } = useProducts(
		{
			organizationId,
			collectionId,
			limit: 10,
			sort: "newest", // Default sort
			...(location?.id ? { locationId: location.id } : {}),
		},
		!!organizationId && !!collectionId,
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
				(t: { languageCode: string }) => t.languageCode === "en",
			) || firstVariant?.translations?.[0];

		return {
			id: p.id,
			name: p.translations?.find((t) => t.languageCode === "en")?.name || "",
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
