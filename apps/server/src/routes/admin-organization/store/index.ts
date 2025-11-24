import { createRouter } from "@/lib/create-hono-app";
import { inventoryRoute } from "./inventory/route";
import { orderRoute } from "./order/route";
import { productRoute } from "./product/product";
import { productCollectionRoute } from "./product/product-collection/product-collection";
import { productReviewRoute } from "./product/product-review/product-review";
import { productVariantRoute } from "./product/product-variant/product-variant";
import { shippingMethodZoneRoute } from "./shipping/method-zone";
import { shippingMethodRoute } from "./shipping/shipping";
import { shippingZoneRoute } from "./shipping/zone";
import { brandRoute } from "./supplier/brand/brand";
import { supplierRoute } from "./supplier/supplier";

// Combine all store-related routes into a single router
export const storeRoute = createRouter()
	.route("/", productRoute)
	.route("/", productVariantRoute)
	.route("/", productCollectionRoute)
	.route("/", productReviewRoute)
	.route("/", inventoryRoute)
	.route("/", supplierRoute)
	.route("/", brandRoute)
	.route("/", shippingMethodRoute)
	.route("/", shippingZoneRoute)
	.route("/", shippingMethodZoneRoute)
	.route("/", orderRoute);
