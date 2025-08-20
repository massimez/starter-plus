import type { Context, Next } from "hono";

// Simple in-memory rate limiter
// In production, use Redis or a proper rate limiting service
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(windowMs = 60000, max = 100) {
	return async (c: Context, next: Next) => {
		const key =
			c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";

		const now = Date.now();
		const windowStart = now - windowMs;

		// Clean up old entries
		for (const [k, v] of rateLimitStore.entries()) {
			if (v.resetTime < windowStart) {
				rateLimitStore.delete(k);
			}
		}

		const current = rateLimitStore.get(key);

		if (!current) {
			rateLimitStore.set(key, { count: 1, resetTime: now });
		} else if (current.resetTime < windowStart) {
			rateLimitStore.set(key, { count: 1, resetTime: now });
		} else if (current.count >= max) {
			return c.json(
				{
					success: false,
					error: "Too many requests",
					retryAfter: Math.ceil((current.resetTime + windowMs - now) / 1000),
				},
				429,
			);
		} else {
			current.count++;
		}

		await next();
	};
}
