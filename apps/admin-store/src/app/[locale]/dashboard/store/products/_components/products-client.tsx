"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { PaginationControls } from "@workspace/ui/components/pagination-controls";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { PageDashboardHeader } from "@/app/[locale]/(landing)/_components/sections/page-dashboard-header";
import { DEFAULT_LOCALE, LOCALES } from "@/constants/locales";
import { useNuqsPagination } from "@/hooks/use-nuqs-pagination";
import { hc } from "@/lib/api-client";
import { CollectionFilter } from "../../_components/collection-filter";
import { useProductCollections } from "../../product-collections/hooks/use-product-collection";
import { ProductList } from "./product-list";
import { useProducts } from "./use-products";

export const ProductsClient = () => {
	const queryClient = useQueryClient();

	const [selectedLanguage, setSelectedLanguage] = useQueryState(
		"locale",
		parseAsString.withDefault(DEFAULT_LOCALE),
	);
	const [searchQuery, setSearchQuery] = useQueryState(
		"search",
		parseAsString.withDefault("").withOptions({ throttleMs: 500 }),
	);
	const [selectedCollection, setSelectedCollection] = useQueryState(
		"collection",
		parseAsString,
	);

	const { data: collectionsData } = useProductCollections(selectedLanguage);
	const collections = collectionsData?.data || [];

	const pagination = useNuqsPagination();

	const { data: productsData, isLoading } = useProducts({
		languageCode: selectedLanguage,
		limit: pagination.limit.toString(),
		offset: pagination.offset.toString(),
		search: searchQuery || undefined,
		collectionId: selectedCollection || undefined,
		setTotal: pagination.setTotal,
	});

	const products = productsData?.data || [];

	const handleClearFilters = () => {
		setSearchQuery(null);
		setSelectedCollection(null);
		pagination.setPage(1);
	};

	const hasActiveFilters = searchQuery || selectedCollection;

	return (
		<div className="p-4">
			<div className="mb-6 flex flex-col justify-between">
				<PageDashboardHeader title="Products" />
				<div className="flex flex-wrap items-center gap-4">
					<div className="relative max-w-sm flex-1">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search products..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value || null);
								pagination.setPage(1);
							}}
							className="pr-9 pl-9"
						/>
						{searchQuery && (
							<button
								type="button"
								onClick={() => {
									setSearchQuery(null);
									pagination.setPage(1);
								}}
								className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground hover:text-foreground"
							>
								<X className="h-4 w-4" />
							</button>
						)}
					</div>
					<CollectionFilter
						collections={collections}
						selectedCollectionId={selectedCollection || null}
						onSelect={(val) => {
							setSelectedCollection(val || null);
							pagination.setPage(1);
						}}
					/>
					<Select
						onValueChange={(val) => {
							setSelectedLanguage(val);
							pagination.setPage(1);
						}}
						defaultValue={selectedLanguage}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="select language" />
						</SelectTrigger>
						<SelectContent>
							{LOCALES.map((locale) => (
								<SelectItem key={locale.code} value={locale.code}>
									{locale.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{hasActiveFilters && (
						<Button variant="outline" onClick={handleClearFilters}>
							Clear Filters
						</Button>
					)}
					<Link href={`/${selectedLanguage}/dashboard/store/products/new`}>
						<Button>Add Product</Button>
					</Link>
				</div>
			</div>
			<ProductList
				products={products}
				selectedLanguage={selectedLanguage}
				isLoading={isLoading}
				onDeleteProduct={async (productId) => {
					await hc.api.store.products[":id"].$delete({
						param: { id: productId },
					});
					queryClient.invalidateQueries({ queryKey: ["products"] });
				}}
			/>
			<PaginationControls pagination={pagination} className="mt-4" />
		</div>
	);
};
