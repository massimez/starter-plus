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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProductCard } from "./product-card";
import type { Product } from "./use-products";

interface ProductListProps {
	products: Product[];
	selectedLanguage: string;
	onDeleteProduct?: (productId: string) => Promise<void>;
}

export const ProductList = ({
	products,
	selectedLanguage,
	onDeleteProduct,
}: ProductListProps) => {
	const router = useRouter();
	const [searchTerm, setSearchTerm] = useState("");
	const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

	const filteredProducts = products.filter(
		(product) =>
			product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.currency?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.status.toLowerCase().includes(searchTerm.toLowerCase()),
	);

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
				<div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
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
