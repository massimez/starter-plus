import auth from "@/routes/auth";
import healthRoutes from "@/routes/health";
import createApp from "./create-hono-app";

const app = createApp()
	.basePath("/api")
	.route("/", healthRoutes)
	.route("/", auth);

export const honoApp = app;
export type App = typeof honoApp;
