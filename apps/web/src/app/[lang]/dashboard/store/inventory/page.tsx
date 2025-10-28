"use client";

import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@workspace/ui/components/tabs";
import { useState } from "react";
import {
	useActiveOrganization,
	useGetLocations,
} from "@/app/[lang]/dashboard/organization/queries";
import { PageDashboardHeader } from "@/components/sections/page-dashboard-header";
import {
	BatchesList,
	BatchModal,
	InventoryList,
	TransactionModal,
	TransactionsList,
} from "./_components";
import { useGroupedInventory } from "./hooks/use-inventory-grouped";

export default function InventoryPage() {
	const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
	const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
	const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
		null,
	);
	const [selectedLocationId, setSelectedLocationId] = useState<string>("");

	const { activeOrganization } = useActiveOrganization();
	const { data: locationsData } = useGetLocations(activeOrganization?.id);

	const {
		data: inventoryQueryResult,
		isLoading,
		error,
	} = useGroupedInventory(selectedLocationId || undefined);

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error: {error.message}</div>;

	const handleOpenBatchModal = (variantId: string) => {
		setSelectedVariantId(variantId);
		setIsBatchModalOpen(true);
	};

	const handleOpenTransactionModal = (variantId: string) => {
		setSelectedVariantId(variantId);
		setIsTransactionModalOpen(true);
	};

	const handleLocationChange = (locationId: string) => {
		const normalizedId = locationId === "ALL" ? "" : locationId;
		setSelectedLocationId(normalizedId);
	};

	return (
		<div className="p-4">
			<div className="mb-4 flex items-center justify-between">
				<PageDashboardHeader title="Inventory Management" />
			</div>

			<Tabs defaultValue="stock" className="w-full">
				<TabsList>
					<TabsTrigger value="stock">Stock Overview</TabsTrigger>
					{/* <TabsTrigger value="batches">Batches</TabsTrigger> */}
					<TabsTrigger value="transactions">Transactions</TabsTrigger>
				</TabsList>

				<TabsContent value="stock" className="mt-6">
					<InventoryList
						inventory={inventoryQueryResult || []}
						onAddBatch={handleOpenBatchModal}
						onAddTransaction={handleOpenTransactionModal}
						locationsData={locationsData?.data ? locationsData.data : []}
						onLocationChange={handleLocationChange}
						defaultLocationId={selectedLocationId || "ALL"}
						showLocationFilter={true}
					/>
				</TabsContent>

				<TabsContent value="batches" className="mt-6">
					<BatchesList />
				</TabsContent>

				<TabsContent value="transactions" className="mt-6">
					<TransactionsList />
				</TabsContent>
			</Tabs>

			{isBatchModalOpen && (
				<BatchModal
					open={isBatchModalOpen}
					onOpenChange={setIsBatchModalOpen}
					onClose={() => setSelectedVariantId(null)}
					selectedVariantId={selectedVariantId as string}
				/>
			)}

			<TransactionModal
				open={isTransactionModalOpen}
				onOpenChange={setIsTransactionModalOpen}
				productVariantId={selectedVariantId}
				onClose={() => setSelectedVariantId(null)}
			/>
		</div>
	);
}
