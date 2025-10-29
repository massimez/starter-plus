"use client";

import { useQuery } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

export type Product = {
	id: string;
	metadata: never;
	createdAt: string;
	organizationId: string;
	updatedAt: string | null;
	status: string;
	taxRate: string;
	allowBackorders: boolean;
	currency?: string;
	deletedAt: string | null;
	createdBy: string | null;
	name: string;
	isFeatured: boolean;
	isActive: boolean;
	trackStock: boolean;
	minQuantity: number;
	maxQuantity: number | null;
	type?: string;
	collectionId?: string | null;
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
};

type ProductsResponse = {
	total: number;
	data: Product[];
};

type ProductsParams = {
	limit?: string;
	offset?: string;
	languageCode?: string;
};

export const getProducts = async ({
	limit = "10",
	offset = "0",
	languageCode,
}: ProductsParams = {}) => {
	const res = await hc.api.store.products.$get({
		query: { limit, offset, languageCode },
	});

	if (!res.ok) {
		const errorText = await res.text().catch(() => res.statusText);
		throw new Error(`Failed to fetch products: ${errorText}`);
	}

	const json = await res.json();

	if ("error" in json) {
		throw new Error(json.error.message || "Failed to fetch products");
	}

	if (!json.data || !Array.isArray(json.data)) {
		throw new Error("Invalid response format");
	}

	return json;
};

export const useProducts = ({
	limit = "20",
	offset = "0",
	languageCode,
}: ProductsParams = {}) => {
	return useQuery({
		queryKey: ["products", limit, offset, languageCode],
		queryFn: () => getProducts({ limit, offset, languageCode }),
	});
};
