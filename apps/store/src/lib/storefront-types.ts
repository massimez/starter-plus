export interface Collection {
	id: string;
	name: string;
	slug: string;
	description?: string | null;
	parentId?: string | null;
	image?: string | null;
	sortOrder: number;
	isActive: boolean;
	isVisible: boolean;
	translations?:
		| {
				languageCode: string;
				name: string;
				slug: string;
				description?: string;
				metaTitle?: string;
				metaDescription?: string;
		  }[]
		| null;
	children?: Collection[];
	createdAt: string;
	updatedAt: string | null;
}

/**
 * Flatten nested collections into a single array
 */
export function flattenCollections(collections: Collection[]): Collection[] {
	const result: Collection[] = [];

	function flatten(items: Collection[]) {
		for (const item of items) {
			result.push(item);
			if (item.children && item.children.length > 0) {
				flatten(item.children);
			}
		}
	}

	flatten(collections);
	return result;
}

// Storefront-specific types that extend or override the server-generated types
// These match what the storefront API actually returns

export interface ProductVariantStock {
	quantity: number;
	reservedQuantity: number;
	availableQuantity: number;
}

export interface ProductVariant {
	id: string;
	sku: string;
	price: string | number;
	weightKg?: string | number | null;
	compareAtPrice?: string | number | null;
	cost?: string | number | null;
	maxStock?: number | null;
	isActive?: boolean;
	stock?: ProductVariantStock | null;
	translations?:
		| {
				languageCode: string;
				name?: string;
				attributes?: Record<string, string>;
		  }[]
		| null;
	createdAt: string;
	updatedAt: string | null;
	deletedAt: string | null;
	createdBy: string | null;
	updatedBy: string | null;
	organizationId: string;
	productId: string;
}

export interface Product {
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
				specifications?: Record<string, string>;
		  }[]
		| null;
	variants?: ProductVariant[];
	images?: { url: string; alt?: string | null }[];
	thumbnailImage?: { url: string; alt?: string | null };
}

export interface Address {
	type: "billing" | "shipping";
	street?: string;
	city: string;
	country?: string;
	state?: string;
	postalCode?: string;
	isDefault?: boolean;
	lat?: number;
	lng?: number;
}
