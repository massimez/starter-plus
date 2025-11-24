import { useQuery } from "@tanstack/react-query";
import { storefrontClient } from "@/lib/storefront";

export function useOrganization(slug: string) {
	return useQuery({
		queryKey: ["organization", slug],
		queryFn: () => storefrontClient.getOrganization({ orgSlug: slug }),
	});
}

export function useProducts(
	params: Parameters<typeof storefrontClient.getProducts>[0],
	enabled = true,
) {
	return useQuery({
		queryKey: ["products", params],
		queryFn: () => storefrontClient.getProducts(params),
		enabled,
	});
}

export function useCollections(organizationId: string, enabled = true) {
	return useQuery({
		queryKey: ["collections", organizationId],
		queryFn: () => storefrontClient.getCollections({ organizationId }),
		enabled,
	});
}

export function useDefaultLocation(organizationId: string, enabled = true) {
	return useQuery({
		queryKey: ["defaultLocation", organizationId],
		queryFn: () => storefrontClient.getDefaultLocation({ organizationId }),
		enabled: enabled && !!organizationId,
	});
}

export function useProduct(
	params: Parameters<typeof storefrontClient.getProduct>[0],
	enabled = true,
) {
	return useQuery({
		queryKey: ["product", params],
		queryFn: () => storefrontClient.getProduct(params),
		enabled,
	});
}
