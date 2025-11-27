"use client";

import { useQuery } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

export type ProductVariant = {
	id: string;
	sku: string;
	price: string | number;
	weightKg?: string | number | null;
	compareAtPrice?: string | number | null;
	cost?: string | number | null;
	maxStock?: number | null;
	isActive?: boolean;
	translations?:
		| {
				languageCode: string;
				name?: string;
				attributes?: Record<string, string>;
		  }[]
		| null;
};

export type Product = {
	id: string;
	metadata: unknown;
	createdAt: string;
	organizationId: string;
	updatedAt: string | null;
	status: string;
	taxRate: string;
	allowBackorders: boolean;
	currency?: string;
	deletedAt: string | null;
	createdBy: string | null;
	name: string | null;
	isFeatured: boolean;
	isActive: boolean;
	trackStock: boolean;
	minQuantity: number;
	maxQuantity: number | null;
	type?: string;
	collectionIds?: string[];
	brandId?: string | null;
	translations:
		| {
				languageCode: string;
				name: string;
				slug: string;
				shortDescription?: string | null;
				description?: string | null;
				brandName?: string | null;
				images?: { url: string; alt?: string | null }[] | null;
				seoTitle?: string | null;
				seoDescription?: string | null;
				tags?: string | null;
		  }[]
		| null;
	variants?: ProductVariant[];
};

type ProductsParams = {
	limit?: string;
	offset?: string;
	languageCode?: string;
	search?: string;
	collectionId?: string;
	setTotal?: (total: number) => void;
};

export const getProducts = async ({
	limit = "10",
	offset = "0",
	languageCode,
	search,
	collectionId,
	setTotal,
}: ProductsParams = {}) => {
	const res = await hc.api.store.products.$get({
		query: { limit, offset, languageCode, search, collectionId },
	});

	if (!res.ok) {
		const errorText = await res.text().catch(() => res.statusText);
		throw new Error(`Failed to fetch products: ${errorText}`);
	}

	const json = await res.json();
	if (json.error) {
		throw new Error(json.error.message || "Failed to fetch products");
	}

	if (!json.data) {
		throw new Error("Invalid response format");
	}

	setTotal?.(json.data.total);

	return json.data;
};

export const useProducts = ({
	limit = "20",
	offset = "0",
	languageCode,
	search,
	collectionId,
	setTotal,
}: ProductsParams = {}) => {
	return useQuery({
		queryKey: ["products", limit, offset, languageCode, search, collectionId],
		queryFn: () =>
			getProducts({
				limit,
				offset,
				languageCode,
				search,
				collectionId,
				setTotal,
			}),
	});
};
