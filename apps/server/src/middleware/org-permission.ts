import { createMiddleware } from "hono/factory";
import { auth } from "@/lib/auth";

/**
 * Hono middleware: ensures user has specified permissions
 */

export const hasOrgPermission = (
	requiredPermission: string, // e.g., "organization:update"
) =>
	createMiddleware(async (c, next) => {
		const organizationId = c.req.query("organizationId");
		await next();

		if (!organizationId) {
			return c.json({ error: "Organization ID is required" }, 400);
		}

		const [resource, action] = requiredPermission.split(":");

		if (!resource || !action) {
			return c.json({ error: "Invalid permission format" }, 400);
		}

		// Call Better Auth's hasPermission API
		const res = await auth.api.hasPermission({
			headers: c.req.raw.headers,
			body: {
				organizationId,
				permission: {
					[resource]: [action],
				},
			},
		});

		if (!res.success || res.error) {
			return c.json({ error: "Forbidden" }, 403);
		}

		await next();
	});
