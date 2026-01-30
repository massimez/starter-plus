import { headers } from "next/headers";

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

	const parts = hostWithoutPort.split(".");

	// 1. Handle localhost
	if (hostWithoutPort.includes("localhost")) {
		return parts.length > 1 ? parts[0] : undefined;
	}

	// 2. Handle 'www'
	const cleanParts = parts[0] === "www" ? parts.slice(1) : parts;

	// 3. Logic for Slugs
	if (cleanParts.length === 2) {
		return cleanParts.join(".");
	}
	if (cleanParts.length > 2) {
		return cleanParts[0];
	}

	return undefined;
}
