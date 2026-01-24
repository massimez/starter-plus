import { relations } from "drizzle-orm";
import { productVariantStockTransaction } from "../store/inventory";
import { location } from "../store/location";
import { productVariant } from "../store/product";

export const productVariantStockTransactionRelations = relations(
	productVariantStockTransaction,
	({ one }) => ({
		variant: one(productVariant, {
			fields: [productVariantStockTransaction.productVariantId],
			references: [productVariant.id],
		}),
		location: one(location, {
			fields: [productVariantStockTransaction.locationId],
			references: [location.id],
		}),
	}),
);
