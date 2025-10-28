"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Input } from "@workspace/ui/components/input";
import { Package } from "lucide-react";
import { useState } from "react";
import { ProductCard } from "./product-card";
import { ProductModal } from "./product-modal";
import type { Product } from "./use-products";
import { type ProductVariant, VariantModal } from "./variant-modal";

interface ProductListProps {
	products: Product[];
	selectedLanguage: string;
	onDeleteProduct?: (productId: string) => Promise<void>;
	onAddVariant?: (
		productId: string,
		variant: Partial<ProductVariant>,
	) => Promise<void>;
	onUpdateVariant?: (
		variantId: string,
		variant: Partial<ProductVariant>,
	) => Promise<void>;
	onDeleteVariant?: (variantId: string) => Promise<void>;
}

export const ProductList = ({
	products,
	selectedLanguage,
	onDeleteProduct,
	onAddVariant,
	onUpdateVariant,
	onDeleteVariant,
}: ProductListProps) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(
		undefined,
	);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
	const [deleteVariantId, setDeleteVariantId] = useState<string | null>(null);
	const [variantModalProduct, setVariantModalProduct] =
		useState<Product | null>(null);
	const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(
		null,
	);

	const filteredProducts = products.filter(
		(product) =>
			product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.currency?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.status.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const handleEditClick = (product: Product) => {
		setSelectedProduct(product);
		setIsModalOpen(true);
	};

	const handleModalClose = () => {
		setIsModalOpen(false);
		setSelectedProduct(undefined);
	};

	const handleDeleteClick = (productId: string) => {
		setDeleteProductId(productId);
	};

	const handleDeleteConfirm = async () => {
		if (deleteProductId && onDeleteProduct) {
			await onDeleteProduct(deleteProductId);
			setDeleteProductId(null);
		}
	};

	const handleAddVariantClick = (product: Product) => {
		setVariantModalProduct(product);
		setEditingVariant(null);
	};

	const handleEditVariantClick = (
		product: Product,
		variant: ProductVariant,
	) => {
		setVariantModalProduct(product);
		setEditingVariant(variant);
	};

	const handleVariantSubmit = async (variantData: Partial<ProductVariant>) => {
		if (!variantModalProduct) return;

		if (editingVariant) {
			// Update existing variant
			if (onUpdateVariant) {
				await onUpdateVariant(editingVariant.id, variantData);
			}
		} else {
			// Add new variant
			if (onAddVariant) {
				await onAddVariant(variantModalProduct.id, variantData);
			}
		}
	};

	const handleDeleteVariantClick = (variantId: string) => {
		setDeleteVariantId(variantId);
	};

	const handleDeleteVariantConfirm = async () => {
		if (deleteVariantId && onDeleteVariant) {
			await onDeleteVariant(deleteVariantId);
			setDeleteVariantId(null);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4">
				<Input
					placeholder="Search products by name, ID, currency, or status..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="max-w-md"
				/>
				<p className="whitespace-nowrap text-muted-foreground text-sm">
					{filteredProducts.length}{" "}
					{filteredProducts.length === 1 ? "product" : "products"}
				</p>
			</div>

			{filteredProducts.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<Package className="mb-4 h-12 w-12 text-muted-foreground" />
					<h3 className="mb-2 font-semibold text-lg">No products found</h3>
					<p className="text-muted-foreground text-sm">
						{searchTerm
							? "Try adjusting your search terms"
							: "Get started by creating your first product"}
					</p>
				</div>
			) : (
				<div className="grid grid-cols-[repeat(auto-fit,minmax(200px,400px))] gap-4">
					{filteredProducts.map((product) => (
						<ProductCard
							key={product.id}
							product={product}
							selectedLanguage={selectedLanguage}
							onEdit={handleEditClick}
							onDelete={handleDeleteClick}
							onAddVariant={handleAddVariantClick}
							onEditVariant={handleEditVariantClick}
							onDeleteVariant={handleDeleteVariantClick}
						/>
					))}
				</div>
			)}

			{/* Product Edit Modal */}
			<ProductModal
				open={isModalOpen}
				onOpenChange={handleModalClose}
				product={selectedProduct}
				selectedLanguage={selectedLanguage}
			/>

			{/* Variant Modal */}
			<VariantModal
				open={!!variantModalProduct}
				onOpenChange={(open) => {
					if (!open) {
						setVariantModalProduct(null);
						setEditingVariant(null);
					}
				}}
				variant={editingVariant || undefined}
				productName={variantModalProduct?.name || ""}
				selectedLanguage={selectedLanguage}
				onSubmit={handleVariantSubmit}
			/>

			{/* Delete Product Confirmation Dialog */}
			<AlertDialog
				open={!!deleteProductId}
				onOpenChange={() => setDeleteProductId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Product</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this product? This action cannot
							be undone. All variants associated with this product will also be
							deleted.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Delete Variant Confirmation Dialog */}
			<AlertDialog
				open={!!deleteVariantId}
				onOpenChange={() => setDeleteVariantId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Variant</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this variant? This action cannot
							be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteVariantConfirm}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};
