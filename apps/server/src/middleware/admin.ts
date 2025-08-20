import type { Context, Next } from "hono";

export async function adminMiddleware(c: Context, next: Next) {
	const userRole = c.get("userRole");

	if (userRole !== "admin") {
		return c.json(
			{
				success: false,
				error: "Forbidden - Admin access required",
			},
			403,
		);
	}

	await next();
}
