import auth from "@/routes/auth";
import healthRoutes from "@/routes/health";
import { locationRoute } from "@/routes/organization/location";
import { organizationInfoRoute } from "@/routes/organization/organization-info";
import storageRoutes from "@/routes/storage";
import createApp from "./create-hono-app";

const app = createApp()
	.basePath("/api")
	.route("/", healthRoutes)
	.route("/", auth)
	.route("/organizations", locationRoute)
	.route("/organizations", organizationInfoRoute)
	.route("/storage", storageRoutes);

export const honoApp = app;
export type App = typeof honoApp;
