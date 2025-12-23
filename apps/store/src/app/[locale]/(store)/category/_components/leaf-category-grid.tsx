"use client";

import { ProductCard } from "@/components/features/product-card";
import { useDefaultLocation, useProducts } from "@/lib/hooks/use-storefront";

export function LeafCategoryGrid({ collectionId }: { collectionId: string }) {
	const organizationId = process.env.NEXT_PUBLIC_ORGANIZATION_ID || "";
	const { data: location } = useDefaultLocation(
		organizationId,
		!!organizationId,
	);

	const { data: products = [], isLoading } = useProducts(
		{
			organizationId,
			collectionId,
			limit: 50,
			sort: "newest",
			...(location?.id ? { locationId: location.id } : {}),
		},
		!!organizationId && !!collectionId,
	);

	if (isLoading)
		return <div className="h-96 w-full animate-pulse rounded-xl bg-muted/10" />;

	if (products.length === 0)
		return (
			<div className="py-20 text-center text-muted-foreground">
				No products found.
			</div>
		);

	return (
		<div className="flex">
			{products.map((p) => {
				// Inline mapping logic or extract utility
				const firstVariant = p.variants?.[0];
				const variantTranslation =
					firstVariant?.translations?.find(
						(t: { languageCode: string }) => t.languageCode === "en",
					) || firstVariant?.translations?.[0];

				const mappedProduct = {
					id: p.id,
					name:
						p.translations?.find((t) => t.languageCode === "en")?.name || "",
					price: firstVariant
						? Number.parseFloat(firstVariant.price)
						: p.minPrice || 0,
					category: "",
					description: "",
					image: p.thumbnailImage?.url,
					rating: 4.5,
					reviews: 0,
					isNew:
						new Date(p.createdAt).getTime() >
						Date.now() - 30 * 24 * 60 * 60 * 1000,
					productVariantId: firstVariant?.id,
					variantName: variantTranslation?.name,
					variantSku: firstVariant?.sku,
				};

				return (
					<div
						key={p.id}
						className="flex basis-[240px] justify-center ps-4 md:basis-[260px]"
					>
						<div className="w-full">
							<ProductCard product={mappedProduct} />
						</div>
					</div>
				);
			})}
		</div>
	);
}
