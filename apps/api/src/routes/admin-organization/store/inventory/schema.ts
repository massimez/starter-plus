import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { idAndAuditFields } from "@/helpers/constant/fields";
import {
	productVariantStock,
	productVariantStockTransaction,
} from "@/lib/db/schema";

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
