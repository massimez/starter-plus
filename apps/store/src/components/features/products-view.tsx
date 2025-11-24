"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@workspace/ui/components/sheet";
import { ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { CategoryCarousel } from "@/components/features/category-carousel";
import { type Product, ProductCard } from "@/components/features/product-card";
import { ProductFilters } from "@/components/features/product-filters";
import {
	useCollections,
	useOrganization,
	useProducts,
} from "@/lib/hooks/use-storefront";

// Extended Product type for filters
interface ExtendedProduct extends Product {
	color?: string;
	material?: string;
	brand?: string;
	size?: string;
	subcategory?: string;
}

export function ProductsView() {
	const t = useTranslations("Navigation");
	const [selectedCollections, setSelectedCollections] = useQueryState(
		"collection",
		parseAsArrayOf(parseAsString).withDefault([]),
	);
	const [colors] = useQueryState(
		"color",
		parseAsArrayOf(parseAsString).withDefault([]),
	);
	const [materials] = useQueryState(
		"material",
		parseAsArrayOf(parseAsString).withDefault([]),
	);
	const [brands] = useQueryState(
		"brand",
		parseAsArrayOf(parseAsString).withDefault([]),
	);
	const [sizes] = useQueryState(
		"size",
		parseAsArrayOf(parseAsString).withDefault([]),
	);
	const [sortOrder, setSortOrder] = useQueryState("sort");
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [isSortOpen, setIsSortOpen] = useState(false);

	// Fetch organization and products from API
	const { data: org } = useOrganization("yam");
	const organizationId = org?.id || "qGH0Uy2lnzoOfVeU6kcaLSuqfdKon8qe";

	// Fetch collections
	const { data: collections = [] } = useCollections(
		organizationId,
		!!organizationId,
	);

	// Create a mapping of collection names to IDs for API calls
	const collectionNameToId = collections.reduce(
		(acc, c) => {
			const name =
				c.translations?.find((t) => t.languageCode === "en")?.name ||
				c.name ||
				"";
			acc[name] = c.id;
			return acc;
		},
		{} as Record<string, string>,
	);

	// Convert selected collection names to IDs for API
	const selectedCollectionIds = selectedCollections
		.map((name) => collectionNameToId[name])
		.filter(Boolean);
	const collectionId =
		selectedCollectionIds.length === 1 ? selectedCollectionIds[0] : undefined;

	// Map sort order to API format
	const apiSort =
		sortOrder === "price-low"
			? "price_asc"
			: sortOrder === "price-high"
				? "price_desc"
				: sortOrder === "rating"
					? "newest" // fallback since rating sort isn't in API
					: sortOrder === "newest"
						? "newest"
						: undefined;

	const { data: products = [], isLoading } = useProducts(
		{
			organizationId,
			sort: apiSort,
			limit: 100, // Get more products for filtering
			...(collectionId ? { collectionId } : {}),
		},
		!!organizationId,
	);

	// Map API products to component format
	const allProducts: ExtendedProduct[] = products.map((p) => ({
		id: p.id,
		name: p.translations?.find((t) => t.languageCode === "en")?.name || "",
		price: p.minPrice || 0,
		category: "General", // Keep for compatibility with ProductCard
		description:
			(Array.isArray(p.translations)
				? p.translations.find(
						(t: { languageCode: string; description?: string }) =>
							t.languageCode === "en",
					)?.description
				: "") ||
			p.name ||
			"",
		image: p.thumbnailImage?.url,
		rating: 4.5, // Placeholder - add rating system later
		reviews: 0,
		isNew:
			new Date(p.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000,
	}));

	const filteredProducts = allProducts.filter((p) => {
		// Collection filtering is now handled by API
		if (colors.length > 0 && (!p.color || !colors.includes(p.color)))
			return false;
		if (
			materials.length > 0 &&
			(!p.material || !materials.includes(p.material))
		)
			return false;
		if (brands.length > 0 && (!p.brand || !brands.includes(p.brand)))
			return false;
		if (sizes.length > 0 && (!p.size || !sizes.includes(p.size))) return false;
		return true;
	});

	// Sort products (client-side for rating, since API doesn't support it)
	const sortedProducts = [...filteredProducts].sort((a, b) => {
		switch (sortOrder) {
			case "rating":
				return (b.rating || 0) - (a.rating || 0);
			default:
				return 0; // API handles other sorting
		}
	});

	// Calculate active filter count
	const activeFilterCount =
		selectedCollections.length +
		colors.length +
		materials.length +
		brands.length +
		sizes.length;

	const handleCollectionSelect = (collectionId: string) => {
		if (selectedCollections.includes(collectionId)) {
			const newCollections = selectedCollections.filter(
				(c) => c !== collectionId,
			);
			setSelectedCollections(newCollections.length > 0 ? newCollections : null);
		} else {
			setSelectedCollections([collectionId]);
		}
	};

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-32 w-32 animate-spin rounded-full border-violet-500 border-t-2 border-b-2" />
			</div>
		);
	}

	// Map collections to carousel format - use name for display with parent-child relationships
	const rootCollections = collections.filter((c) => !c.parentId);

	const carouselCollections = rootCollections.map((parent) => {
		// Find child collections for this parent
		const children = collections.filter((c) => c.parentId === parent.id);

		const parentName =
			parent.translations?.find((t) => t.languageCode === "en")?.name ||
			parent.name ||
			"";

		const childNames = children.map(
			(child) =>
				child.translations?.find((t) => t.languageCode === "en")?.name ||
				child.name ||
				"",
		);

		return {
			name: parentName,
			subcategories: childNames,
		};
	});

	return (
		<div className="container mx-auto px-4 py-10">
			<h1 className="mb-8 font-bold text-4xl">{t("products")}</h1>

			<CategoryCarousel
				categories={carouselCollections}
				selectedCategories={selectedCollections}
				onSelectCategory={handleCollectionSelect}
				className="mb-10"
			/>

			{/* Mobile Filter and Sort Buttons */}
			<div className="mb-6 flex items-center gap-3 md:hidden">
				{/* Filter Button with Drawer */}
				<Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
					<SheetTrigger asChild>
						<Button variant="outline" className="relative flex-1">
							<SlidersHorizontal className="mr-2 size-4" />
							Filters
							{activeFilterCount > 0 && (
								<Badge
									variant="destructive"
									className="ml-2 size-5 rounded-full p-0 text-xs"
								>
									{activeFilterCount}
								</Badge>
							)}
						</Button>
					</SheetTrigger>
					<SheetContent side="left" className="w-[300px] overflow-y-auto">
						<SheetHeader>
							<SheetTitle>Filters</SheetTitle>
						</SheetHeader>
						<div className="mt-6">
							<ProductFilters />
						</div>
					</SheetContent>
				</Sheet>

				{/* Sort Button with Drawer */}
				<Sheet open={isSortOpen} onOpenChange={setIsSortOpen}>
					<SheetTrigger asChild>
						<Button variant="outline" className="relative flex-1">
							<ArrowUpDown className="mr-2 size-4" />
							Sort
							{sortOrder && (
								<Badge
									variant="secondary"
									className="ml-2 size-2 rounded-full p-0"
								/>
							)}
						</Button>
					</SheetTrigger>
					<SheetContent side="right" className="w-[300px]">
						<SheetHeader>
							<SheetTitle>Sort By</SheetTitle>
						</SheetHeader>
						<div className="mt-6 space-y-2">
							<Button
								variant={sortOrder === null ? "primary" : "ghost"}
								className="w-full justify-start"
								onClick={() => {
									setSortOrder(null);
									setIsSortOpen(false);
								}}
							>
								Default
							</Button>
							<Button
								variant={sortOrder === "newest" ? "primary" : "ghost"}
								className="w-full justify-start"
								onClick={() => {
									setSortOrder("newest");
									setIsSortOpen(false);
								}}
							>
								Newest First
							</Button>
							<Button
								variant={sortOrder === "price-low" ? "primary" : "ghost"}
								className="w-full justify-start"
								onClick={() => {
									setSortOrder("price-low");
									setIsSortOpen(false);
								}}
							>
								Price: Low to High
							</Button>
							<Button
								variant={sortOrder === "price-high" ? "primary" : "ghost"}
								className="w-full justify-start"
								onClick={() => {
									setSortOrder("price-high");
									setIsSortOpen(false);
								}}
							>
								Price: High to Low
							</Button>
							<Button
								variant={sortOrder === "rating" ? "primary" : "ghost"}
								className="w-full justify-start"
								onClick={() => {
									setSortOrder("rating");
									setIsSortOpen(false);
								}}
							>
								Highest Rated
							</Button>
						</div>
					</SheetContent>
				</Sheet>

				{/* Active Filters Display */}
				{activeFilterCount > 0 && (
					<div className="flex items-center gap-2">
						<span className="text-muted-foreground text-sm">
							{activeFilterCount} active
						</span>
					</div>
				)}
			</div>

			<div className="flex flex-col gap-8 md:flex-row">
				{/* Sidebar Filters - Hidden on mobile */}
				<aside className="hidden w-full shrink-0 space-y-6 md:block md:w-64">
					<ProductFilters />
				</aside>

				{/* Product Grid */}
				<div className="flex-1">
					<div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
						{sortedProducts.length > 0 ? (
							sortedProducts.map((product) => (
								<div key={product.id} className="flex justify-center">
									<div className="w-full max-w-[280px]">
										<ProductCard product={product} showWishlist />
									</div>
								</div>
							))
						) : (
							<div className="col-span-full py-12 text-center text-muted-foreground">
								<p>No products found matching your filters.</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
