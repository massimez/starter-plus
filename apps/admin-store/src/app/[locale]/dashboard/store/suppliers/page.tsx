"use client";
import { Button } from "@workspace/ui/components/button";
import { useState } from "react";
import { PageDashboardHeader } from "@/app/[locale]/(landing)/_components/sections/page-dashboard-header";
import { SupplierList } from "./_components/supplier-list";
import { SupplierModal } from "./_components/supplier-modal";
import { useSuppliers } from "./hooks";

const SuppliersPage = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	// biome-ignore lint/suspicious/noExplicitAny: <>
	const [editingSupplier, setEditingSupplier] = useState<any>(null);

	const { data: suppliersQueryResult, isLoading, error } = useSuppliers();

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error: {error.message}</div>;

	return (
		<div className="p-4">
			<div className="mb-4 flex flex-col justify-between">
				<PageDashboardHeader title="Suppliers" />
				<div className="flex items-center gap-4">
					<Button onClick={() => setIsModalOpen(true)}>Add Supplier</Button>
				</div>
			</div>
			<SupplierList
				suppliers={suppliersQueryResult?.data || []}
				onEditSupplier={(supplier) => {
					setEditingSupplier(supplier);
					setIsModalOpen(true);
				}}
			/>

			<SupplierModal
				open={isModalOpen}
				onOpenChange={setIsModalOpen}
				editingSupplier={editingSupplier}
				onClose={() => setEditingSupplier(null)}
			/>
		</div>
	);
};

export default SuppliersPage;
