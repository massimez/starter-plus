import { hc } from "@/lib/api-client";

export const storefrontClient = {
	getProducts: async (params: {
		organizationId: string;
		collectionId?: string;
		limit?: number;
		offset?: number;
		sort?: string;
		q?: string;
		minPrice?: number;
		maxPrice?: number;
	}) => {
		const response = await hc.api.storefront.products.$get({
			query: {
				organizationId: params.organizationId,
				...(params.collectionId ? { collectionId: params.collectionId } : {}),
				...(params.sort ? { sort: params.sort } : {}),
				...(params.q ? { q: params.q } : {}),
				limit: (params.limit ?? 10).toString(),
				offset: (params.offset ?? 0).toString(),
				...(params.minPrice !== undefined
					? { minPrice: params.minPrice.toString() }
					: {}),
				...(params.maxPrice !== undefined
					? { maxPrice: params.maxPrice.toString() }
					: {}),
			},
		});
		const json = await response.json();
		if (!json.success) {
			throw new Error(json.error?.message || "Failed to fetch products");
		}
		return json.data;
	},

	getProduct: async (params: { organizationId: string; productId: string }) => {
		const response = await hc.api.storefront.products[":productId"].$get({
			param: { productId: params.productId },
			query: { organizationId: params.organizationId },
		});
		const json = await response.json();
		if (!json.success) {
			throw new Error(json.error?.message || "Failed to fetch product");
		}
		return json.data;
	},

	getCollections: async (params: { organizationId: string }) => {
		const response = await hc.api.storefront.collections.$get({
			query: params,
		});
		const json = await response.json();
		if (!json.success) {
			throw new Error(json.error?.message || "Failed to fetch collections");
		}
		return json.data;
	},

	getOrganization: async (params: {
		orgSlug?: string;
		organizationId?: string;
	}) => {
		const response = await hc.api.storefront.organizations.info.$get({
			query: params,
		});
		console.log(response);
		const json = await response.json();
		if (!json.success) {
			throw new Error(json.error?.message || "Failed to fetch organization");
		}
		return json.data;
	},

	getDefaultLocation: async (params: { organizationId: string }) => {
		const response = await hc.api.storefront.locations.default.$get({
			query: params,
		});
		const json = await response.json();
		if (!json.success) {
			throw new Error(
				json.error?.message || "Failed to fetch default location",
			);
		}
		return json.data;
	},

	createOrder: async (params: {
		organizationId: string;
		shippingAddress: {
			street: string;
			city: string;
			state: string;
			country: string;
			postalCode: string;
		};
		items: Array<{
			productVariantId: string;
			quantity: number;
			locationId: string;
		}>;
		currency: string;
		customerEmail?: string;
		customerPhone?: string;
		customerFullName?: string;
		locationId: string;
		userId?: string;
	}) => {
		const response = await hc.api.storefront.orders.$post({
			json: params,
		});
		const json = await response.json();
		if (!json.success) {
			throw new Error(json.error?.message || "Failed to create order");
		}
		return json.data;
	},
};
