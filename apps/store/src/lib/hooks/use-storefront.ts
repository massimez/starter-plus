import { useQuery } from "@tanstack/react-query";
import { storefrontClient } from "@/lib/storefront";
import { getTenantSlug } from "@/lib/tenant/get-tenant";

export function useOrganization() {
	const slug = getTenantSlug();
	return useQuery({
		queryKey: ["organization", slug],
		queryFn: () =>
			storefrontClient.getOrganization({ orgSlug: slug || undefined }),
		enabled: !!slug,
	});
}

export function useProducts(
	params: Parameters<typeof storefrontClient.getProducts>[0],
	enabled = true,
) {
	const slug = getTenantSlug();
	return useQuery({
		queryKey: ["products", params, slug],
		queryFn: () => storefrontClient.getProducts(params),
		enabled: enabled && !!slug,
	});
}

export function useCollections(enabled = true) {
	const slug = getTenantSlug();
	return useQuery({
		queryKey: ["collections", slug],
		queryFn: async () => {
			const collections = await storefrontClient.getCollections();
			return collections;
		},
		enabled: enabled && !!slug,
	});
}

export function useDefaultLocation(enabled = true) {
	const slug = getTenantSlug();
	return useQuery({
		queryKey: ["defaultLocation", slug],
		queryFn: () => storefrontClient.getDefaultLocation(),
		enabled: enabled && !!slug,
	});
}

export function useProduct(
	params: Parameters<typeof storefrontClient.getProduct>[0],
	enabled = true,
) {
	const slug = getTenantSlug();
	return useQuery({
		queryKey: ["product", params, slug],
		queryFn: () => storefrontClient.getProduct(params),
		enabled: enabled && !!slug,
	});
}

export function useOrders(
	params: Parameters<typeof storefrontClient.getOrders>[0],
	enabled = true,
) {
	const slug = getTenantSlug();
	return useQuery({
		queryKey: ["orders", params, slug],
		queryFn: () => storefrontClient.getOrders(params),
		enabled: enabled && !!slug,
	});
}

export function useOrder(
	params: { orderId: string; userId?: string },
	enabled = true,
) {
	const { orderId, userId } = params;
	const slug = getTenantSlug();

	return useQuery({
		queryKey: ["order", orderId, slug],
		queryFn: () => storefrontClient.getOrder({ orderId, userId }),
		enabled: enabled && !!slug && !!orderId,
	});
}
