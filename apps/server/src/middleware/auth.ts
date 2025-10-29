import { createMiddleware } from "hono/factory";
import { auth } from "../lib/auth";
import { createErrorResponse } from "./error-handler";

export const authMiddleware = createMiddleware(async (c, next) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) {
		c.set("session", null);
		c.set("user", null);
		return c.json(
			createErrorResponse("Unauthorized", "Authentication required", [
				{
					code: "UNAUTHORIZED",
					path: ["authorization"],
					message: "Valid authentication credentials are required",
				},
			]),
			401,
		);
	}
	c.set("session", session.session);
	c.set("user", session.user);
	await next();
});
