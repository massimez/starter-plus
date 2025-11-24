import { createRouter } from "@/lib/create-hono-app";
import { collectionsRoutes } from "./collections";
import { locationRoutes } from "./locations";
import { ordersRoutes } from "./orders";
import { organizationRoutes } from "./organization";
import { productsRoutes } from "./products";

export const storefrontRoutes = createRouter()
	.route("/products", productsRoutes)
	.route("/orders", ordersRoutes)
	.route("/collections", collectionsRoutes)
	.route("/locations", locationRoutes)
	.route("/organizations", organizationRoutes);

export default storefrontRoutes;
