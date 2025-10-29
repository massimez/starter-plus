import { hc } from "hono/client";

import type { App } from "./app";

const client = hc<App>("");
export type Client = typeof client;

export const hcWithType = (...args: Parameters<typeof hc>): Client =>
	hc<App>(...args);

export * from "@/lib/db/schema/store/location";
export * from "../routes/organization/schema";
export {
	insertProductVariantBatchSchema,
	insertProductVariantStockSchema as insertInventoryVariantStockSchema,
	insertProductVariantStockTransactionSchema,
	updateProductVariantBatchSchema,
	updateProductVariantStockSchema as updateInventoryVariantStockSchema,
	updateProductVariantStockTransactionSchema,
} from "../routes/store/inventory/schema";
export * from "../routes/store/order/schema";
export * from "../routes/store/product/schema";
export * from "../routes/store/supplier/schema";
