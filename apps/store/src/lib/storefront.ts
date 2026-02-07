import { hc } from "@/lib/api-client";

export class StorefrontError extends Error {
	issues?: Array<{
		code: string;
		path: (string | number)[];
		message: string;
	}>;

	constructor(
		message: string,
		issues?: Array<{
			code: string;
			path: (string | number)[];
			message: string;
		}>,
	) {
		super(message);
		this.name = "StorefrontError";
		this.issues = issues;
	}
}

export const storefrontClient = {
	getProducts: async (params: {
		collectionId?: string;
		limit?: number;
		offset?: number;
		sort?: string;
		q?: string;
		minPrice?: number;
		maxPrice?: number;
		locationId?: string;
	}) => {
		const response = await hc.api.storefront.products.$get({
			query: {
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
				...(params.locationId ? { locationId: params.locationId } : {}),
			},
		});
		const json = await response.json();
		if (!json.success) {
			throw new Error(json.error?.message || "Failed to fetch products");
		}
		return json.data;
	},

	getProduct: async (params: { productId: string; locationId?: string }) => {
		const response = await hc.api.storefront.products[":productId"].$get({
			param: { productId: params.productId },
			query: {
				...(params.locationId ? { locationId: params.locationId } : {}),
			},
		});
		const json = await response.json();
		if (!json.success) {
			throw new Error(json.error?.message || "Failed to fetch product");
		}
		return json.data;
	},

	getCollections: async () => {
		const response = await hc.api.storefront.collections.$get();
		const json = await response.json();
		if (!json.success) {
			throw new Error(json.error?.message || "Failed to fetch collections");
		}
		return json.data;
	},

	getOrganization: async (params: { orgSlug?: string }) => {
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

	getDefaultLocation: async () => {
		const response = await hc.api.storefront.locations.default.$get();
		const json = await response.json();
		if (!json.success) {
			throw new Error(
				json.error?.message || "Failed to fetch default location",
			);
		}
		return json.data;
	},

	createOrder: async (params: {
		shippingAddress: {
			street?: string;
			city: string;
			state: string;
			country?: string;
			postalCode?: string;
			latitude?: number;
			longitude?: number;
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
		couponCode?: string;
	}) => {
		const response = await hc.api.storefront.orders.$post({
			json: params,
		});
		const json = await response.json();
		if (!json.success) {
			const errorData = json;
			const errorMessage =
				typeof errorData.error === "string"
					? errorData.error
					: errorData.error?.message || "Failed to create order";
			const errorIssues =
				typeof errorData.error === "object"
					? errorData.error?.issues
					: undefined;

			throw new StorefrontError(errorMessage, errorIssues);
		}
		return json.data;
	},

	getOrders: async (params: {
		userId: string;
		limit?: number;
		offset?: number;
	}) => {
		const response = await hc.api.storefront.orders.$get({
			query: {
				userId: params.userId,
				limit: (params.limit ?? 20).toString(),
				offset: (params.offset ?? 0).toString(),
			},
		});
		const json = await response.json();
		if (!json.success) {
			throw new Error(json.error?.message || "Failed to fetch orders");
		}
		return json.data;
	},

	getOrder: async (params: { orderId: string; userId?: string }) => {
		const response = await hc.api.storefront.orders[":orderId"].$get({
			param: { orderId: params.orderId },
			query: {
				...(params.userId ? { userId: params.userId } : {}),
			},
		});
		const json = await response.json();
		if (!json.success) {
			throw new Error(json.error?.message || "Failed to fetch order");
		}
		return json.data;
	},

	// Client Profile Management
	getMyProfile: async () => {
		const response = await hc.api.storefront.client.me.$get();
		const json = await response.json();
		if (!json.success) {
			const errorData = json;
			const errorMessage =
				typeof errorData.error === "string"
					? errorData.error
					: errorData.error?.message || "Failed to fetch profile";
			const errorIssues =
				typeof errorData.error === "object"
					? errorData.error?.issues
					: undefined;

			throw new StorefrontError(errorMessage, errorIssues);
		}
		return json.data;
	},

	updateMyProfile: async (data: {
		firstName?: string;
		lastName?: string;
		email?: string;
		phone?: string;
		addresses?: Array<{
			type: "billing" | "shipping";
			street?: string;
			city: string;
			country?: string;
			state?: string;
			postalCode?: string;
			isDefault?: boolean;
			lat?: number;
			lng?: number;
		}>;
		preferredContactMethod?: "email" | "phone" | "sms";
		language?: string;
		timezone?: string;
		marketingConsent?: boolean;
		gdprConsent?: boolean;
		notes?: string;
	}) => {
		const response = await hc.api.storefront.client.me.$put({
			json: data,
		});
		const json = await response.json();
		if (!json.success) {
			const errorData = json;
			const errorMessage =
				typeof errorData.error === "string"
					? errorData.error
					: errorData.error?.message || "Failed to update profile";
			const errorIssues =
				typeof errorData.error === "object"
					? errorData.error?.issues
					: undefined;

			throw new StorefrontError(errorMessage, errorIssues);
		}
		return json.data;
	},
};
