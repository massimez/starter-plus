import type { Context, Next } from "hono";

export async function adminMiddleware(c: Context, next: Next) {
	const user = c.get("user");

	if (!user || user.role !== "admin") {
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
