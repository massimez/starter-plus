import { adminRoutes } from "@/routes/admin";
import { locationRoute } from "@/routes/admin-organization/organization/location/location";
import { organizationInfoRoute } from "@/routes/admin-organization/organization/organization-info";
import { storeRoute } from "@/routes/admin-organization/store";
import auth from "@/routes/auth";
import healthRoutes from "@/routes/health";
import storageRoutes from "@/routes/storage/storage";
import storefrontRoutes from "@/routes/storefront";
import createApp from "./create-hono-app";

const app = createApp()
	.basePath("/api")
	.route("/", healthRoutes)
	.route("/", auth)
	.route("/organizations", locationRoute)
	.route("/organizations", organizationInfoRoute)
	.route("/storage", storageRoutes)
	.route("/store", storeRoute)
	.route("/storefront", storefrontRoutes)
	.route("/admin", adminRoutes);

export const honoApp = app;
export type App = typeof honoApp;
