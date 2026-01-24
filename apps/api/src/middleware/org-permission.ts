import { createMiddleware } from "hono/factory";
import { auth } from "@/lib/auth";
import { createErrorResponse } from "@/middleware/error-handler";

/**
 * Hono middleware: ensures user has specified permissions
 */

export const hasOrgPermission = (
	requiredPermission: string, // e.g., "organization:update"
) =>
	createMiddleware(async (c, next) => {
		let organizationId = c.req.query("organizationId");

		if (!organizationId) {
			organizationId = c.var.tenantId || undefined;
		}

		await next();

		if (!organizationId) {
			return c.json(
				createErrorResponse("ValidationError", "Organization ID is required", [
					{
						code: "MISSING_ORG_ID",
						path: ["organizationId"],
						message: "Organization ID is required in query parameters",
					},
				]),
				400,
			);
		}

		const [resource, action] = requiredPermission.split(":");

		if (!resource || !action) {
			return c.json(
				createErrorResponse("ValidationError", "Invalid permission format", [
					{
						code: "INVALID_PERMISSION",
						path: ["permission"],
						message: "Permission must be in format 'resource:action'",
					},
				]),
				400,
			);
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
			return c.json(
				createErrorResponse("ForbiddenError", "Access denied", [
					{
						code: "INSUFFICIENT_PERMISSIONS",
						path: [resource],
						message: `You don't have permission to ${action} this ${resource}`,
					},
				]),
				403,
			);
		}

		await next();
	});
