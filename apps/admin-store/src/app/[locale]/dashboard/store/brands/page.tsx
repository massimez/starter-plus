"use client";
import { Button } from "@workspace/ui/components/button";
import { useState } from "react";
import { PageDashboardHeader } from "@/app/[locale]/(landing)/_components/sections/page-dashboard-header";
import { BrandList } from "./_components/brand-list";
import { BrandModal } from "./_components/brand-modal";
import { useBrands } from "./hooks";

const BrandsPage = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	// biome-ignore lint/suspicious/noExplicitAny: <>
	const [editingBrand, setEditingBrand] = useState<any>(null);

	const { data: brandsQueryResult, isLoading, error } = useBrands();

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error: {error.message}</div>;

	return (
		<div className="p-4">
			<div className="mb-4 flex flex-col justify-between">
				<PageDashboardHeader title="Brands" />
				<div className="flex items-center gap-4">
					<Button onClick={() => setIsModalOpen(true)}>Add Brand</Button>
				</div>
			</div>
			<BrandList
				brands={brandsQueryResult?.data || []}
				onEditBrand={(brand) => {
					setEditingBrand(brand);
					setIsModalOpen(true);
				}}
			/>

			<BrandModal
				open={isModalOpen}
				onOpenChange={setIsModalOpen}
				editingBrand={editingBrand}
				onClose={() => setEditingBrand(null)}
			/>
		</div>
	);
};

export default BrandsPage;
