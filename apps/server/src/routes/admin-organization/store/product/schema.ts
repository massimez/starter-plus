import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { idAndAuditFields } from "@/helpers/constant/fields";
import {
	product,
	productCollection,
	productCollectionAssignment,
	productReview,
	productSupplier,
	productVariant,
	productVariantStock,
} from "@/lib/db/schema";

// Product Translation Schema for embedding
export const productTranslationEmbeddedSchema = z.object({
	languageCode: z.string().min(1, "languageCode is required"),
	name: z.string().min(1, "name is required"),
	slug: z.string().min(1, "slug is required"),
	shortDescription: z.string().optional(),
	description: z.string().optional(),
	brandName: z.string().optional(),
	seoTitle: z.string().optional(),
	seoDescription: z.string().optional(),
	tags: z.string().optional(),
	specifications: z.record(z.string(), z.any()).optional(),
});

// Product Variant Translation Schema for embedding
export const productVariantTranslationEmbeddedSchema = z.object({
	languageCode: z.string().min(1, "languageCode is required"),
	name: z.string().optional(), // e.g. "Red / L"
	attributes: z.record(z.string(), z.string()).optional(), // optional localized attrs
});

// Base product schemas
export const baseInsertProductSchema = createInsertSchema(product);
export const baseUpdateProductSchema = createSelectSchema(product).partial();

// Combined Product Insert Schema
export const insertProductSchema = baseInsertProductSchema.extend({
	images: z
		.array(
			z.object({
				url: z.string(),
				key: z.string(),
				name: z.string(),
				size: z.number(),
				type: z.string(),
			}),
		)
		.optional(),
	thumbnailImage: z
		.object({
			url: z.string(),
			key: z.string(),
			name: z.string(),
			size: z.number(),
			type: z.string(),
		})
		.optional(),
	translations: z
		.array(productTranslationEmbeddedSchema)
		.min(1, "At least one translation is required"),
});

// Combined Product Update Schema
export const updateProductSchema = baseUpdateProductSchema.extend({
	images: z
		.array(
			z.object({
				url: z.string(),
				key: z.string(),
				name: z.string(),
				size: z.number(),
				type: z.string(),
			}),
		)
		.optional(),
	thumbnailImage: z
		.object({
			url: z.string(),
			key: z.string(),
			name: z.string(),
			size: z.number(),
			type: z.string(),
		})
		.optional(),
	translations: z.array(productTranslationEmbeddedSchema.partial()).optional(),
});

export const insertProductCollectionSchema =
	createInsertSchema(productCollection);
export const updateProductCollectionSchema = createSelectSchema(
	productCollection,
)
	.omit(idAndAuditFields)
	.partial();

export const insertProductVariantSchema = createInsertSchema(
	productVariant,
).extend({
	translations: z
		.array(productVariantTranslationEmbeddedSchema)
		.min(1, "At least one translation is required"),
});
export const updateProductVariantSchema = createSelectSchema(productVariant)
	.omit(idAndAuditFields)
	.partial()
	.extend({
		translations: z
			.array(
				productVariantTranslationEmbeddedSchema
					.partial()
					.required({ languageCode: true }),
			)
			.optional(),
	});

export const insertProductVariantStockSchema =
	createInsertSchema(productVariantStock);
export const updateProductVariantStockSchema = createSelectSchema(
	productVariantStock,
)
	.omit(idAndAuditFields)
	.partial();

export const insertProductCollectionAssignmentSchema = createInsertSchema(
	productCollectionAssignment,
);
export const updateProductCollectionAssignmentSchema = createSelectSchema(
	productCollectionAssignment,
)
	.omit(idAndAuditFields)
	.partial();

export const insertProductSupplierSchema = createInsertSchema(productSupplier);
export const updateProductSupplierSchema =
	createSelectSchema(productSupplier).partial();

export const insertProductReviewSchema = createInsertSchema(productReview);
export const updateProductReviewSchema = createSelectSchema(productReview)
	.omit(idAndAuditFields)
	.partial();
