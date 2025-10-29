"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { PageDashboardHeader } from "@/components/sections/page-dashboard-header";
import { DEFAULT_LOCALE, LOCALES } from "@/constants/locales";
import { hc } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { ProductList } from "./_components/product-list";
import { ProductModal } from "./_components/product-modal";
import { useProducts } from "./_components/use-products";

const ProductsPage = () => {
	const t = useTranslations("common");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const queryClient = useQueryClient();
	const activeOrg = authClient.useActiveOrganization();

	const [selectedLanguage, setSelectedLanguage] = useState(DEFAULT_LOCALE);
	const {
		data: productsQueryResult,
		isLoading,
		error,
	} = useProducts({ languageCode: selectedLanguage });

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error: {error.message}</div>;

	return (
		<div className="p-4">
			<div className="mb-4 flex flex-col justify-between">
				<PageDashboardHeader title="Products" />
				<div className="flex items-center gap-4">
					<Select
						onValueChange={setSelectedLanguage}
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
					<Button onClick={() => setIsModalOpen(true)}>Add Product</Button>
				</div>
			</div>
			<ProductList
				products={(productsQueryResult?.data as any) || []}
				selectedLanguage={selectedLanguage}
				onDeleteProduct={async (productId) => {
					await hc.api.store.products[":id"].$delete({
						param: { id: productId },
					});
					queryClient.invalidateQueries({ queryKey: ["products"] });
				}}
				onAddVariant={async (productId, variant) => {
					if (!activeOrg.data?.id) {
						console.error("Active organization ID is not available.");
						return;
					}
					await hc.api.store["product-variants"].$post({
						json: {
							...variant,
							productId,
							sku: variant.sku || "", // Ensure sku is a string
							price:
								variant?.price !== undefined && variant?.price !== null
									? String(variant?.price)
									: "0", // Ensure price is a string or undefined
							weightKg:
								variant.weightKg !== undefined && variant.weightKg !== null
									? String(variant.weightKg)
									: variant.weightKg, // Ensure weightKg is a string or undefined
							compareAtPrice:
								variant.compareAtPrice !== undefined &&
								variant.compareAtPrice !== null
									? String(variant.compareAtPrice)
									: variant.compareAtPrice, // Ensure compareAtPrice is a string or undefined
							cost:
								variant.cost !== undefined && variant.cost !== null
									? String(variant.cost)
									: variant.cost, // Ensure cost is a string or undefined
							translations: variant.translations || [], // Ensure translations is an array
							organizationId: activeOrg.data.id,
						},
					});
					queryClient.invalidateQueries({ queryKey: ["products"] });
				}}
				onUpdateVariant={async (variantId, variant) => {
					const updatedVariant = {
						...variant,
						weightKg:
							variant.weightKg !== undefined && variant.weightKg !== null
								? String(variant.weightKg)
								: variant.weightKg,
						price:
							variant?.price !== undefined && variant?.price !== null
								? String(variant?.price)
								: variant?.price,
						compareAtPrice:
							variant.compareAtPrice !== undefined &&
							variant.compareAtPrice !== null
								? String(variant.compareAtPrice)
								: variant.compareAtPrice,
						cost:
							variant.cost !== undefined && variant.cost !== null
								? String(variant.cost)
								: variant.cost,
						sku:
							variant.sku !== undefined && variant.sku !== null
								? String(variant.sku)
								: undefined,
						dimensionsCm: {
							length: variant.dimensionsCm?.length ?? null,
							width: variant.dimensionsCm?.width ?? null,
							height: variant.dimensionsCm?.height ?? null,
						},
					};
					await hc.api.store["product-variants"][":id"].$put({
						param: { id: variantId },
						json: updatedVariant,
					});
					queryClient.invalidateQueries({ queryKey: ["products"] });
				}}
				onDeleteVariant={async (variantId) => {
					await hc.api.store["product-variants"][":id"].$delete({
						param: { id: variantId },
					});
					queryClient.invalidateQueries({ queryKey: ["products"] });
				}}
			/>

			<ProductModal
				open={isModalOpen}
				onOpenChange={setIsModalOpen}
				selectedLanguage={selectedLanguage}
			/>
		</div>
	);
};

export default ProductsPage;
