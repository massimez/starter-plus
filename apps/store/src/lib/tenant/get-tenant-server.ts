import { headers } from "next/headers";
import { parseTenantSlug } from "@/lib/tenant/parse-tenant-slug";

/**
 * Extracts slug from host header.
 * If host is 'somedomain.com', returns 'somedomain.com'.
 * If host is 'sub.somedomain.com', returns 'sub'.
 */
export async function getTenantSlugServer(): Promise<string | undefined> {
	const headersList = await headers();
	const host = headersList.get("host") ?? ""; // Using nullish coalescing

	// Split always returns at least one element, but TS is being cautious
	const hostWithoutPort = host.split(":")[0] || "";

	if (!hostWithoutPort) return undefined;

	return parseTenantSlug(hostWithoutPort);
}
