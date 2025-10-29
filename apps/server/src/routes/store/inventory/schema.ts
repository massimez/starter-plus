import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { idAndAuditFields } from "@/helpers/constant/fields";
import {
	productVariantBatch,
	productVariantStock,
	productVariantStockTransaction,
} from "@/lib/db/schema";

export const insertProductVariantBatchSchema =
	createInsertSchema(productVariantBatch);
export const updateProductVariantBatchSchema = createSelectSchema(
	productVariantBatch,
)
	.omit(idAndAuditFields)
	.partial();

export const insertProductVariantStockSchema =
	createInsertSchema(productVariantStock);
export const updateProductVariantStockSchema = createSelectSchema(
	productVariantStock,
)
	.omit(idAndAuditFields)
	.partial();

export const insertProductVariantStockTransactionSchema = createInsertSchema(
	productVariantStockTransaction,
);
export const updateProductVariantStockTransactionSchema = createSelectSchema(
	productVariantStockTransaction,
)
	.omit(idAndAuditFields)
	.partial();
