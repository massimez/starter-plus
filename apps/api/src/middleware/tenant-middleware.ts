import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { db } from "@/lib/db";
import { organization } from "@/lib/db/schema";
import { cache } from "@/lib/redis/cache";

/**
 * Extracts tenant slug from hostname using consistent logic
 * Matches the logic in store/src/lib/get-tenant.ts
 */
function extractSlugFromHostname(hostname: string): string {
	const parts = hostname.split(".");

	if (hostname.includes("localhost")) {
		// localhost:3000 -> "localhost"
		// tenant.localhost:3000 -> "tenant"
		return parts.length > 1 ? parts[0] : "localhost";
	}

	// Production domains
	// example.com -> "example.com"
	// www.example.com -> "example.com" (strip www)
	// tenant.example.com -> "tenant"

	if (parts.length === 2) {
		// example.com -> "example.com"
		return hostname;
	}

	if (parts.length > 2) {
		if (parts[0] === "www") {
			// www.example.com -> "example.com"
			return parts.slice(1).join(".");
		}
		// tenant.example.com -> "tenant"
		return parts[0];
	}

	// Fallback for edge cases (single part domain)
	return hostname;
}

/**
 * Attempts to extract slug from the Referer header
 * Used for cross-origin API calls from storefront
 */
function extractSlugFromReferer(referer: string | undefined): string | null {
	if (!referer) return null;

	try {
		const refererUrl = new URL(referer);
		return extractSlugFromHostname(refererUrl.hostname);
	} catch {
		// Invalid referer URL
		return null;
	}
}

/**
 * Tenant middleware that extracts organization context from subdomain
 * Sets 'tenant' and 'tenantId' in context if valid tenant found
 */
export const tenantMiddleware = createMiddleware(async (c, next) => {
	// Priority 1: Parse from Referer header (for cross-origin API calls)
	let slug = extractSlugFromReferer(c.req.header("Referer"));

	// Priority 2: Parse from request hostname (for same-origin requests)
	if (!slug) {
		const url = new URL(c.req.url);
		slug = extractSlugFromHostname(url.hostname);
	}

	// Early return if no slug found - avoid unnecessary cache/DB lookups
	if (!slug) {
		await next();
		return;
	}

	// Fetch organization from cache/DB
	try {
		const sanitizedSlug = slug
			.replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with hyphens
			.replace(/^-+|-+$/g, "");

		const org = await cache.remember(
			`tenant:slug:${sanitizedSlug}`,
			300, // 5 minutes
			async () => {
				return await db.query.organization.findFirst({
					where: eq(organization.slug, sanitizedSlug),
				});
			},
		);

		if (org) {
			c.set("tenant", org);
			c.set("tenantId", org.id);
		}
	} catch (error) {
		// Log error but continue - tenant will be undefined
		console.error(`Failed to fetch tenant for slug "${slug}":`, error);
	}

	await next();
});
