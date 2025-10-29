import auth from "@/routes/auth";
import healthRoutes from "@/routes/health";
import { locationRoute } from "@/routes/organization/location/location";
import { organizationInfoRoute } from "@/routes/organization/organization-info";
import storageRoutes from "@/routes/storage/storage";
import { storeRoute } from "@/routes/store";
import createApp from "./create-hono-app";

const app = createApp()
	.basePath("/api")
	.route("/", healthRoutes)
	.route("/", auth)
	.route("/organizations", locationRoute)
	.route("/organizations", organizationInfoRoute)
	.route("/storage", storageRoutes)
	.route("/store", storeRoute);

export const honoApp = app;
export type App = typeof honoApp;
