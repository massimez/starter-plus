import { useDefaultLocation } from "./use-storefront";

/**
 * Hook to get the default location ID for adding items to cart
 * Returns the location ID or null if not available
 */
export function useDefaultLocationId() {
	const organizationId = process.env.NEXT_PUBLIC_ORGANIZATION_ID || "";
	const { data: defaultLocation, isLoading } = useDefaultLocation(
		organizationId,
		!!organizationId,
	);

	return {
		locationId: defaultLocation?.id || null,
		isLoading,
		organizationId,
	};
}
