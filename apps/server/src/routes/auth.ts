import { auth } from "@/lib/auth";
import { createRouter } from "@/lib/create-hono-app";

const authRouter = createRouter().on(["POST", "GET"], "/auth/**", (c) => {
	return auth.handler(c.req.raw);
});

export default authRouter;
