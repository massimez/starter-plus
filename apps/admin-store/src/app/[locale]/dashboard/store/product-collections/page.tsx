"use client";

import { useState } from "react";
import { PageDashboardHeader } from "@/app/[locale]/(landing)/_components/sections/page-dashboard-header";
import { DEFAULT_LOCALE } from "@/constants/locales";
import { ProductCollectionList } from "./_components/product-collection-list";
import { ProductCollectionModal } from "./_components/product-collection-modal";

export default function ProductCollectionsPage() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedLanguage, setSelectedLanguage] = useState(DEFAULT_LOCALE);

	return (
		<div className="space-y-4">
			<PageDashboardHeader
				title="Product Collections"
				description="Manage your product collections"
			/>
			<ProductCollectionList
				selectedLanguage={selectedLanguage}
				setSelectedLanguage={setSelectedLanguage}
			/>
			<ProductCollectionModal
				currentLanguage={selectedLanguage}
				open={isModalOpen}
				onOpenChange={setIsModalOpen}
			/>
		</div>
	);
}
