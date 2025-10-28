"use client";

import { Button } from "@workspace/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@workspace/ui/components/tabs";
import { useEffect, useState } from "react";

export interface ProductVariant {
	id: string;
	productId: string;
	sku: string;
	barcode?: string;
	barcodeType?: string;
	weightKg?: number;
	dimensionsCm?: { length?: number; width?: number; height?: number };
	reorderPoint: number;
	maxStock?: number;
	reorderQuantity: number;
	price: number;
	compareAtPrice?: number;
	cost?: number;
	unit?: string;
	isActive: boolean;
	translations?: {
		languageCode: string;
		name?: string;
		attributes?: Record<string, string>;
	}[];
}

interface VariantModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	variant?: ProductVariant;
	productName: string;
	selectedLanguage: string;
	onSubmit: (variant: Partial<ProductVariant>) => Promise<void>;
}

export const VariantModal = ({
	open,
	onOpenChange,
	variant,
	productName,
	selectedLanguage,
	onSubmit,
}: VariantModalProps) => {
	const isEdit = !!variant;

	const [formData, setFormData] = useState<Partial<ProductVariant>>({
		sku: "",
		price: 0,
		cost: 0,
		compareAtPrice: 0,
		reorderPoint: 10,
		reorderQuantity: 50,
		isActive: true,
		translations: [],
		dimensionsCm: {},
	});

	useEffect(() => {
		if (variant) {
			setFormData({
				...variant,
				translations: variant.translations || [
					{ languageCode: selectedLanguage, name: "" },
				],
			});
		} else {
			setFormData({
				sku: "",
				price: 0,
				cost: 0,
				compareAtPrice: 0,
				reorderPoint: 10,
				reorderQuantity: 50,
				isActive: true,
				translations: [{ languageCode: selectedLanguage, name: "" }],
				dimensionsCm: {},
			});
		}
	}, [variant, selectedLanguage, open]);

	const updateTranslation = (field: string, value: string) => {
		const translations = formData.translations || [];
		const existingIndex = translations.findIndex(
			(t) => t.languageCode === selectedLanguage,
		);

		if (existingIndex >= 0) {
			translations[existingIndex] = {
				languageCode: selectedLanguage,
				...translations[existingIndex],
				[field]: value,
			};
		} else {
			translations.push({
				languageCode: selectedLanguage,
				[field]: value,
			} as any);
		}

		setFormData({ ...formData, translations });
	};

	const getTranslationValue = (field: string): string => {
		const translation = formData.translations?.find(
			(t) => t.languageCode === selectedLanguage,
		);
		return (translation?.[field as keyof typeof translation] as string) || "";
	};

	const handleSubmit = async () => {
		await onSubmit(formData);
		onOpenChange(false);
	};

	const isFormValid =
		formData.sku && formData.price !== undefined && formData.price > 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{isEdit ? "Edit Variant" : "Add Variant"}</DialogTitle>
					<DialogDescription>
						{isEdit ? "Update" : "Create a new"} variant for {productName}
					</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue="general" className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="general">General</TabsTrigger>
						<TabsTrigger value="pricing">Pricing</TabsTrigger>
						<TabsTrigger value="inventory">Inventory</TabsTrigger>
					</TabsList>

					<TabsContent value="general" className="mt-4 space-y-4">
						<div className="grid gap-4">
							<div className="grid gap-2">
								<Label htmlFor="variant-name">Variant Name *</Label>
								<Input
									id="variant-name"
									placeholder="e.g., Small / Red"
									value={getTranslationValue("name")}
									onChange={(e) => updateTranslation("name", e.target.value)}
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="grid gap-2">
									<Label htmlFor="variant-sku">SKU *</Label>
									<Input
										id="variant-sku"
										placeholder="e.g., PROD-VAR-001"
										value={formData.sku}
										onChange={(e) =>
											setFormData({ ...formData, sku: e.target.value })
										}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="variant-barcode">Barcode</Label>
									<Input
										id="variant-barcode"
										placeholder="e.g., 123456789012"
										value={formData.barcode || ""}
										onChange={(e) =>
											setFormData({ ...formData, barcode: e.target.value })
										}
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="grid gap-2">
									<Label htmlFor="variant-barcode-type">Barcode Type</Label>
									<Input
										id="variant-barcode-type"
										placeholder="e.g., UPC, EAN"
										value={formData.barcodeType || ""}
										onChange={(e) =>
											setFormData({ ...formData, barcodeType: e.target.value })
										}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="variant-unit">Unit</Label>
									<Input
										id="variant-unit"
										placeholder="e.g., piece, kg, liter"
										value={formData.unit || ""}
										onChange={(e) =>
											setFormData({ ...formData, unit: e.target.value })
										}
									/>
								</div>
							</div>
							<div className="flex items-center space-x-2">
								<Switch
									id="variant-active"
									checked={formData.isActive}
									onCheckedChange={(checked) =>
										setFormData({ ...formData, isActive: checked })
									}
								/>
								<Label htmlFor="variant-active">Active</Label>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="pricing" className="mt-4 space-y-4">
						<div className="grid gap-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="grid gap-2">
									<Label htmlFor="variant-price">Price *</Label>
									<Input
										id="variant-price"
										type="number"
										step="0.01"
										placeholder="0.00"
										value={formData.price}
										onChange={(e) =>
											setFormData({
												...formData,
												price: Number.parseFloat(e.target.value) || 0,
											})
										}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="variant-cost">Cost</Label>
									<Input
										id="variant-cost"
										type="number"
										step="0.01"
										placeholder="0.00"
										value={formData.cost}
										onChange={(e) =>
											setFormData({
												...formData,
												cost: Number.parseFloat(e.target.value) || 0,
											})
										}
									/>
								</div>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="variant-compare-price">Compare at Price</Label>
								<Input
									id="variant-compare-price"
									type="number"
									step="0.01"
									placeholder="0.00"
									value={formData.compareAtPrice}
									onChange={(e) =>
										setFormData({
											...formData,
											compareAtPrice: Number.parseFloat(e.target.value) || 0,
										})
									}
								/>
								<p className="text-muted-foreground text-xs">
									Original price for showing discounts
								</p>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="inventory" className="mt-4 space-y-4">
						<div className="grid gap-4">
							<div className="grid grid-cols-3 gap-4">
								<div className="grid gap-2">
									<Label htmlFor="variant-reorder-point">Reorder Point *</Label>
									<Input
										id="variant-reorder-point"
										type="number"
										value={formData.reorderPoint}
										onChange={(e) =>
											setFormData({
												...formData,
												reorderPoint: Number.parseInt(e.target.value) || 10,
											})
										}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="variant-reorder-qty">
										Reorder Quantity *
									</Label>
									<Input
										id="variant-reorder-qty"
										type="number"
										value={formData.reorderQuantity}
										onChange={(e) =>
											setFormData({
												...formData,
												reorderQuantity: Number.parseInt(e.target.value) || 50,
											})
										}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="variant-max-stock">Max Stock</Label>
									<Input
										id="variant-max-stock"
										type="number"
										value={formData.maxStock || ""}
										onChange={(e) =>
											setFormData({
												...formData,
												maxStock: Number.parseInt(e.target.value) || undefined,
											})
										}
									/>
								</div>
							</div>
							<div className="grid grid-cols-4 gap-4">
								<div className="grid gap-2">
									<Label htmlFor="variant-weight">Weight (kg)</Label>
									<Input
										id="variant-weight"
										type="number"
										step="0.001"
										placeholder="0.000"
										value={formData.weightKg || ""}
										onChange={(e) =>
											setFormData({
												...formData,
												weightKg:
													Number.parseFloat(e.target.value) || undefined,
											})
										}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="variant-length">Length (cm)</Label>
									<Input
										id="variant-length"
										type="number"
										step="0.1"
										value={formData.dimensionsCm?.length || ""}
										onChange={(e) =>
											setFormData({
												...formData,
												dimensionsCm: {
													...formData.dimensionsCm,
													length:
														Number.parseFloat(e.target.value) || undefined,
												},
											})
										}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="variant-width">Width (cm)</Label>
									<Input
										id="variant-width"
										type="number"
										step="0.1"
										value={formData.dimensionsCm?.width || ""}
										onChange={(e) =>
											setFormData({
												...formData,
												dimensionsCm: {
													...formData.dimensionsCm,
													width: Number.parseFloat(e.target.value) || undefined,
												},
											})
										}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="variant-height">Height (cm)</Label>
									<Input
										id="variant-height"
										type="number"
										step="0.1"
										value={formData.dimensionsCm?.height || ""}
										onChange={(e) =>
											setFormData({
												...formData,
												dimensionsCm: {
													...formData.dimensionsCm,
													height:
														Number.parseFloat(e.target.value) || undefined,
												},
											})
										}
									/>
								</div>
							</div>
						</div>
					</TabsContent>
				</Tabs>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={!isFormValid}>
						{isEdit ? "Update" : "Add"} Variant
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
