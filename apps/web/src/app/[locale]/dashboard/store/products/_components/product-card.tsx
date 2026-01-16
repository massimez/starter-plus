"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@workspace/ui/components/card";
import {
	Calendar,
	DollarSign,
	Edit,
	Eye,
	EyeOff,
	Layers,
	Tag,
	Trash2,
} from "lucide-react";
import type { Product, ProductVariant } from "./use-products";

interface ProductCardProps {
	product: Product;
	selectedLanguage: string;
	onEdit: (product: Product) => void;
	onDelete: (productId: string) => void;
}

export const ProductCard = ({
	product,
	selectedLanguage,
	onEdit,
	onDelete,
}: ProductCardProps) => {
	const translation = product.translations?.find(
		(t) => t.languageCode === selectedLanguage,
	);
	const displayName = translation?.name || product.name || "Untitled Product";
	const shortDescription = translation?.shortDescription;
	// biome-ignore lint/suspicious/noExplicitAny: <>
	const variants = (product as any).variants || [];

	const getVariantTranslation = (variant: ProductVariant) => {
		return variant.translations?.find(
			(t) => t.languageCode === selectedLanguage,
		);
	};

	const getStatusVariant = (status: string) => {
		switch (status) {
			case "published":
				return "success";
			case "draft":
				return "secondary";
			case "archived":
				return "destructive";
			default:
				return "outline";
		}
	};

	const getTypeIcon = (type?: string) => {
		switch (type) {
			case "digital":
				return "📱";
			case "variable":
				return "🔄";
			default:
				return "📦";
		}
	};

	return (
		<Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
			<CardHeader className="space-y-2 pb-3">
				<div className="flex items-start justify-between gap-2">
					<div className="flex-1 space-y-1">
						<div className="flex items-center gap-2">
							<span className="text-lg">{getTypeIcon(product.type)}</span>
							<h3 className="line-clamp-1 font-semibold text-base leading-tight">
								{displayName}
							</h3>
						</div>
						{shortDescription && (
							<p className="line-clamp-2 text-muted-foreground text-sm">
								{shortDescription}
							</p>
						)}
					</div>
					<div className="flex shrink-0 gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-6"
							onClick={() => onEdit(product)}
						>
							<Edit className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-6 text-destructive hover:text-destructive"
							onClick={() => onDelete(product.id)}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>

				<div className="flex flex-wrap gap-2">
					<Badge variant={getStatusVariant(product.status)} className="text-xs">
						{product.status === "active" ? (
							<Eye className="mr-1 h-3 w-3" />
						) : (
							<EyeOff className="mr-1 h-3 w-3" />
						)}

						{product.status.charAt(0).toUpperCase() + product.status.slice(1)}
					</Badge>
					{product.isFeatured && (
						<Badge variant="outline" className="text-xs">
							⭐ Featured
						</Badge>
					)}
				</div>
			</CardHeader>

			<CardContent className="flex-1 space-y-3 pt-0 text-sm">
				{product.currency && (
					<div className="flex items-center gap-2 text-muted-foreground">
						<DollarSign className="h-4 w-4" />
						<span className="font-medium">{product.currency}</span>
						{product.taxRate && (
							<span className="text-xs">
								(Tax: {(Number(product.taxRate) * 100).toFixed(1)}%)
							</span>
						)}
					</div>
				)}

				{product.collectionIds && product.collectionIds.length > 0 && (
					<div className="flex items-center gap-2 text-muted-foreground">
						<Tag className="h-4 w-4" />
						<span className="truncate text-xs">
							Collections: {product.collectionIds.length}
						</span>
					</div>
				)}

				{/* Variants Section */}
				{/* Variants Section */}
				<div className="space-y-2 border-t pt-2">
					<div className="flex items-center gap-2">
						<Layers className="h-4 w-4 text-muted-foreground" />
						<span className="font-medium text-xs">
							Variants ({variants.length})
						</span>
					</div>
					{variants.length > 0 && (
						<div className="max-h-24 space-y-1 overflow-y-auto">
							{variants.map((variant: ProductVariant) => {
								const variantTranslation = getVariantTranslation(variant);
								return (
									<div
										key={variant.id}
										className="group flex items-center justify-between rounded bg-muted/50 px-2 py-1.5 text-xs"
									>
										<div className="min-w-0 flex-1">
											<div className="truncate font-medium">
												{variantTranslation?.name || variant.sku}
											</div>
											<div className="text-muted-foreground text-xs">
												SKU: {variant.sku}
											</div>
										</div>
										<div className="flex items-center gap-2">
											<span className="font-medium text-muted-foreground">
												{product.currency || "$"}{" "}
												{Number(variant?.price).toFixed(2)}
											</span>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				<div className="grid grid-cols-2 gap-2 border-t pt-2 text-xs">
					{product.trackStock && (
						<div className="text-muted-foreground">
							<span className="font-medium">Stock:</span> Tracked
						</div>
					)}
					{product.allowBackorders && (
						<div className="text-muted-foreground">
							<span className="font-medium">Backorders:</span> Allowed
						</div>
					)}
					{product.minQuantity && (
						<div className="text-muted-foreground">
							<span className="font-medium">Min Qty:</span>{" "}
							{product.minQuantity}
						</div>
					)}
					{product.maxQuantity && (
						<div className="text-muted-foreground">
							<span className="font-medium">Max Qty:</span>{" "}
							{product.maxQuantity}
						</div>
					)}
				</div>
			</CardContent>

			<CardFooter className="flex items-center justify-between border-t bg-muted/30 py-2 text-muted-foreground text-xs">
				<div className="flex items-center gap-1">
					<Calendar className="h-3 w-3" />
					<span>
						Created {new Date(product.createdAt).toLocaleDateString()}
					</span>
				</div>
				{product.updatedAt && (
					<div className="text-xs">
						Updated {new Date(product.updatedAt).toLocaleDateString()}
					</div>
				)}
			</CardFooter>
		</Card>
	);
};
