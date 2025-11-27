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
import { LoaderContainer } from "@workspace/ui/components/loader";
import { Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProductCard } from "./product-card";
import type { Product } from "./use-products";

interface ProductListProps {
	products: Product[];
	selectedLanguage: string;
	onDeleteProduct?: (productId: string) => Promise<void>;
	isLoading?: boolean;
}

export const ProductList = ({
	products,
	selectedLanguage,
	onDeleteProduct,
	isLoading = false,
}: ProductListProps) => {
	const router = useRouter();
	const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

	const filteredProducts = products;

	const handleEditClick = (product: Product) => {
		router.push(`/${selectedLanguage}/dashboard/store/products/${product.id}`);
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

	return (
		<div className="space-y-4">
			{isLoading ? (
				<LoaderContainer />
			) : filteredProducts.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-24 text-center">
					<Package className="mb-4 h-12 w-12 text-muted-foreground" />
					<h3 className="mb-2 font-semibold text-lg">No products found</h3>
				</div>
			) : (
				<div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
					{filteredProducts.map((product) => (
						<ProductCard
							key={product.id}
							product={product}
							selectedLanguage={selectedLanguage}
							onEdit={handleEditClick}
							onDelete={handleDeleteClick}
						/>
					))}
				</div>
			)}

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
		</div>
	);
};
