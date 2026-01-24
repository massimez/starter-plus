import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { db } from "@/lib/db";
import { organization } from "@/lib/db/schema";
import { cache } from "@/lib/redis/cache";

export const tenantMiddleware = createMiddleware(async (c, next) => {
	let slug: string | null = null;

	// Priority 1: Parse from Referer header (for cross-origin API calls from storefront)
	const referer = c.req.header("Referer");
	if (referer) {
		try {
			const refererUrl = new URL(referer);
			const hostname = refererUrl.hostname;
			const parts = hostname.split(".");

			// Logic to match store/src/lib/get-tenant.ts
			if (hostname.includes("localhost")) {
				if (parts.length > 1) {
					slug = parts[0];
				}
			} else {
				if (parts.length > 2) {
					if (parts[0] !== "www") {
						slug = parts[0];
					}
				}
			}
		} catch (_e) {
			// Invalid referer URL, ignore
		}
	}

	// Priority 2: Parse from request hostname (for same-origin requests)
	if (!slug) {
		const url = new URL(c.req.url);
		const hostname = url.hostname;
		const parts = hostname.split(".");

		// Logic to match store/src/lib/get-tenant.ts
		if (hostname.includes("localhost")) {
			if (parts.length > 1) {
				slug = parts[0];
			}
		} else {
			if (parts.length > 2) {
				if (parts[0] !== "www") {
					slug = parts[0];
				}
			}
		}
	}

	if (slug) {
		const org = await cache.remember(
			`tenant:slug:${slug}`,
			300, // 5 minutes
			async () => {
				return await db.query.organization.findFirst({
					where: eq(organization.slug, slug),
				});
			},
		);

		if (org) {
			c.set("tenant", org);
			c.set("tenantId", org.id);
		}
	}

	await next();
});
