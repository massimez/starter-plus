import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsView } from "@/components/features/products-view";

export const metadata: Metadata = {
	title: "Products | Shop",
	description:
		"Browse our complete collection of products. Filter by category, price, and more to find exactly what you're looking for.",
};

function ProductsLoading() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="h-32 w-32 animate-spin rounded-full border-violet-500 border-t-2 border-b-2" />
		</div>
	);
}

export default function ProductsPage() {
	return (
		<Suspense fallback={<ProductsLoading />}>
			<ProductsView />
		</Suspense>
	);
}
