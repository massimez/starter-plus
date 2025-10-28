"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { ChevronDown, ChevronRight, Package, Search } from "lucide-react";
import { useState } from "react";

import { StockDataRow } from "./stock-data-row";

interface Product {
	id: string;
	name?: string;
	translations?: Array<{
		name?: string;
		languageCode: string;
	}>;
}

interface ProductVariant {
	id: string;
	sku?: string;
	price?: number;
	translations?: Array<{
		name?: string;
	}>;
	stock?: {
		quantity: number;
		reservedQuantity: number;
	};
}

interface ProductWithVariants {
	id: string;
	name?: string;
	translations?: Array<{
		name?: string;
		languageCode: string;
	}>;
	variants: ProductVariant[];
}

interface InventoryListProps {
	inventory: ProductWithVariants[];
	onAddBatch: (variantId: string) => void;
	onAddTransaction: (variantId: string) => void;
	locationsData?: Array<{
		id: string;
		name: string;
		locationType: string;
		isActive: boolean;
	}>;
	onLocationChange?: (locationId: string) => void;
	defaultLocationId?: string;
	showLocationFilter?: boolean;
}

// Shared type interfaces
export interface FlattenedInventoryItem {
	product: Product;
	variant: ProductVariant;
	productVariantId: string;
	productName: string;
	variantSku: string;
}

export const InventoryList = ({
	inventory,
	onAddBatch,
	onAddTransaction,
	locationsData,
	onLocationChange,
	defaultLocationId,
	showLocationFilter = false,
}: InventoryListProps) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [expandedProducts, setExpandedProducts] = useState<Set<string>>(
		new Set(),
	);

	const toggleProductExpansion = (productId: string) => {
		const newExpanded = new Set(expandedProducts);
		if (newExpanded.has(productId)) {
			newExpanded.delete(productId);
		} else {
			newExpanded.add(productId);
		}
		setExpandedProducts(newExpanded);
	};

	const filteredInventory = inventory.filter(
		(item) =>
			item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.translations?.[0]?.name
				?.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			item.variants.some(
				(variant) =>
					variant.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					variant.translations?.[0]?.name
						?.toLowerCase()
						.includes(searchTerm.toLowerCase()),
			),
	);

	const getTotalStockForProduct = (product: ProductWithVariants) => {
		return product.variants.reduce(
			(total, variant) => total + (variant.stock?.quantity || 0),
			0,
		);
	};

	const getReservedStockForProduct = (product: ProductWithVariants) => {
		return product.variants.reduce(
			(total, variant) => total + (variant.stock?.reservedQuantity || 0),
			0,
		);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4">
				<Input
					placeholder="Search products or variants..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="max-w-md"
				/>
				{showLocationFilter && locationsData && locationsData.length > 0 && (
					<Select
						value={defaultLocationId || "ALL"}
						onValueChange={(value) => onLocationChange?.(value)}
					>
						<SelectTrigger className="w-[200px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">All locations</SelectItem>
							{locationsData
								.filter((location) => location.isActive)
								.map((location) => (
									<SelectItem key={location.id} value={location.id}>
										{location.name} ({location.locationType})
									</SelectItem>
								))}
						</SelectContent>
					</Select>
				)}
				<p className="whitespace-nowrap text-muted-foreground text-sm">
					{filteredInventory.length}{" "}
					{filteredInventory.length === 1 ? "product" : "products"} (
					{filteredInventory.reduce(
						(total, product) => total + product.variants.length,
						0,
					)}{" "}
					variants)
				</p>
			</div>

			{filteredInventory.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12 text-center">
						<Package className="mb-4 h-12 w-12 text-muted-foreground" />
						<CardTitle className="mb-2">No inventory found</CardTitle>
						<p className="text-muted-foreground text-sm">
							{searchTerm
								? "Try adjusting your search terms"
								: "Create products and variants to get started"}
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="rounded-md border">
					{filteredInventory.map((product) => {
						const isExpanded = expandedProducts.has(product.id);
						const totalStock = getTotalStockForProduct(product);
						const reservedStock = getReservedStockForProduct(product);
						const productName =
							product.name ||
							product.translations?.[0]?.name ||
							"Unnamed Product";

						return (
							<div key={product.id} className="border-b last:border-b-0">
								{/* Product Row */}
								<div className="flex cursor-pointer items-center p-4 transition-colors hover:bg-muted/50">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => toggleProductExpansion(product.id)}
										className="mr-2 h-6 w-6 p-1"
									>
										{isExpanded ? (
											<ChevronDown className="h-4 w-4" />
										) : (
											<ChevronRight className="h-4 w-4" />
										)}
									</Button>

									<div className="h-auto flex-1 justify-start space-y-1 p-0">
										<button
											onClick={() => toggleProductExpansion(product.id)}
											className="flex w-full cursor-pointer items-center gap-2"
										>
											<h3 className="font-medium text-sm">{productName}</h3>
											<Badge variant="secondary" className="text-xs">
												{product.variants.length} variants
											</Badge>
										</button>
									</div>

									<div className="flex items-center gap-4 text-muted-foreground text-sm">
										<div className="text-right">
											<div className="font-medium">{totalStock}</div>
											{reservedStock > 0 && (
												<div className="text-xs">
													({reservedStock} reserved)
												</div>
											)}
										</div>
									</div>
								</div>

								{/* Variants Rows */}
								{isExpanded && (
									<div className="border-t bg-muted/30">
										{product.variants.map((variant) => {
											return (
												<StockDataRow
													key={variant.id}
													item={{
														product,
														variant,
														productVariantId: variant.id,
														productName,
														variantSku: variant.sku || "No SKU",
													}}
													onAddBatch={onAddBatch}
													onAddTransaction={onAddTransaction}
													isVariantRow={true}
												/>
											);
										})}
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};
