import auth from "@/routes/auth";
import healthRoutes from "@/routes/health";
import { organizationInfoRoute } from "@/routes/organization/organization-info";
import storageRoutes from "@/routes/storage";
import { locationRoute } from "@/routes/store/location";
import createApp from "./create-hono-app";

const app = createApp()
	.basePath("/api")
	.route("/", healthRoutes)
	.route("/", auth)
	.route("/store/location", locationRoute)
	.route("/org-info", organizationInfoRoute)
	.route("/storage/", storageRoutes);

export const honoApp = app;
export type App = typeof honoApp;
