"use client";

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
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@workspace/ui/components/tabs";
import { Search, X } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { PageDashboardHeader } from "@/app/[locale]/(landing)/_components/sections/page-dashboard-header";
import {
	useActiveOrganization,
	useGetLocations,
} from "@/app/[locale]/dashboard/organization/queries";
import { DEFAULT_LOCALE } from "@/constants/locales";
import { useNuqsPagination } from "@/hooks/use-nuqs-pagination";
import { useProductCollections } from "../product-collections/hooks/use-product-collection";
import {
	InventoryList,
	TransactionModal,
	TransactionsList,
} from "./_components";
import { useGroupedInventory } from "./hooks/use-inventory-grouped";

export default function InventoryPage() {
	const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
	const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
		null,
	);

	// URL Sate Management
	const [searchQuery, setSearchQuery] = useQueryState(
		"search",
		parseAsString.withDefault("").withOptions({ throttleMs: 500 }),
	);
	const [selectedCollection, setSelectedCollection] = useQueryState(
		"collection",
		parseAsString,
	);
	const [selectedLocationId, setSelectedLocationId] = useQueryState(
		"location",
		parseAsString.withDefault("ALL"),
	);
	const [selectedLanguage] = useQueryState(
		"locale",
		parseAsString.withDefault(DEFAULT_LOCALE),
	);

	const pagination = useNuqsPagination();

	const { activeOrganization } = useActiveOrganization();
	const { data: locationsData } = useGetLocations(activeOrganization?.id);
	// We need collections for the filter
	const { data: collectionsData } = useProductCollections(selectedLanguage);
	const collections = collectionsData?.flat || [];

	const normalizedLocationId =
		selectedLocationId === "ALL" ? undefined : selectedLocationId;

	const {
		data: inventoryData,
		isLoading,
		error,
	} = useGroupedInventory({
		locationId: normalizedLocationId,
		limit: pagination.limit.toString(),
		offset: pagination.offset.toString(),
		search: searchQuery || undefined,
		collectionId: selectedCollection || undefined,
		setTotal: pagination.setTotal,
	});

	const inventory = inventoryData || [];

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error: {(error as Error).message}</div>;

	const handleOpenTransactionModal = (variantId: string) => {
		setSelectedVariantId(variantId);
		setIsTransactionModalOpen(true);
	};

	const handleClearFilters = () => {
		setSearchQuery(null);
		setSelectedCollection(null);
		setSelectedLocationId("ALL");
		pagination.setPage(1);
	};

	const hasActiveFilters = !!(
		searchQuery ||
		selectedCollection ||
		selectedLocationId !== "ALL"
	);

	return (
		<div className="p-4">
			<div className="mb-4 flex items-center justify-between">
				<PageDashboardHeader title="Inventory Management" />
			</div>

			<Tabs defaultValue="stock" className="w-full">
				<TabsList>
					<TabsTrigger value="stock">Stock Overview</TabsTrigger>
					<TabsTrigger value="transactions">Transactions</TabsTrigger>
				</TabsList>

				<TabsContent value="stock" className="mt-6">
					<div className="mb-6 flex flex-col justify-between gap-4">
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
									className="w-[300px] pr-9 pl-9"
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

							{/* Collection Filter */}
							<Select
								value={selectedCollection || undefined}
								onValueChange={(val) => {
									setSelectedCollection(val || null);
									pagination.setPage(1);
								}}
							>
								<SelectTrigger className="w-[200px]">
									<SelectValue placeholder="All Collections" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL_COLLECTIONS">
										All Collections
									</SelectItem>
									{collections.map((collection) => (
										<SelectItem key={collection.id} value={collection.id}>
											{collection.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							{/* Location Filter */}
							{locationsData?.data && locationsData.data.length > 0 && (
								<Select
									value={selectedLocationId}
									onValueChange={(val) => {
										setSelectedLocationId(val);
										pagination.setPage(1);
									}}
								>
									<SelectTrigger className="w-[200px]">
										<SelectValue placeholder="All locations" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ALL">All locations</SelectItem>
										{locationsData.data
											.filter((location) => location.isActive)
											.map((location) => (
												<SelectItem key={location.id} value={location.id}>
													{location.name} ({location.locationType})
												</SelectItem>
											))}
									</SelectContent>
								</Select>
							)}

							{hasActiveFilters && (
								<Button variant="outline" onClick={handleClearFilters}>
									Clear Filters
								</Button>
							)}
						</div>
					</div>

					<InventoryList
						inventory={inventory}
						onAddTransaction={handleOpenTransactionModal}
						hasActiveFilters={hasActiveFilters}
					/>
					<PaginationControls pagination={pagination} className="mt-4" />
				</TabsContent>

				<TabsContent value="transactions" className="mt-6">
					<TransactionsList />
				</TabsContent>
			</Tabs>

			<TransactionModal
				open={isTransactionModalOpen}
				onOpenChange={setIsTransactionModalOpen}
				productVariantId={selectedVariantId}
				onClose={() => setSelectedVariantId(null)}
			/>
		</div>
	);
}
