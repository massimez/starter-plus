import { createRouter } from "@/lib/create-hono-app";
import { adminMiddleware } from "@/middleware/admin";
import { authMiddleware } from "@/middleware/auth";
import { emailRoutes } from "./email";

export const adminRoutes = createRouter()
	.use("*", authMiddleware, adminMiddleware)
	.route("/email", emailRoutes);
