/**
 * Parses the tenant slug from the hostname.
 * Logic is consistent for both client and server environments.
 *
 * @param hostname - The hostname (without port) to parse, e.g. "demo.localhost", "sub.domain.com"
 * @returns The extracted slug or undefined if not found/invalid
 */
export function parseTenantSlug(hostname: string): string | undefined {
	const parts = hostname.split(".");
	let slug: string | undefined;

	// 1. Handle localhost
	if (hostname.includes("localhost")) {
		slug = parts.length > 1 ? parts[0] : undefined;
	} else {
		// 2. Handle 'www'
		const cleanParts = parts[0] === "www" ? parts.slice(1) : parts;

		// 3. Logic for Slugs
		if (cleanParts.length === 2) {
			slug = cleanParts.join(".");
		} else if (cleanParts.length > 2) {
			slug = cleanParts[0];
		}
	}

	if (!slug) return undefined;

	return slug
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with hyphens
		.replace(/^-+|-+$/g, "");
}
