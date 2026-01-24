import { insertProductSchema } from "@workspace/server/schema";
import { z } from "zod";

export type ProductVariantFormValues = {
	id?: string;
	sku: string;
	price: number;
	cost?: number;
	compareAtPrice?: number;
	reorderPoint?: number;
	reorderQuantity?: number;
	maxStock: number;
	weightKg?: number;
	barcode?: string;
	isActive: boolean;
	translations: {
		languageCode: string;
		name?: string;
		attributes?: Record<string, string>;
	}[];
	displayName?: string;
	optionValues?: Record<string, string>;
};

export type ProductFormValues = {
	id?: string;
	collectionIds?: string[];
	brandId?: string | null;
	images?: Array<{
		key: string;
		url: string;
		name: string;
		size: number;
		type: string;
		file?: File;
	}>;
	thumbnailImage?: {
		key: string;
		url: string;
		name: string;
		size: number;
		type: string;
	};
	price: number;
	cost?: number;
	compareAtPrice?: number;
	translations: Record<
		string,
		{
			name: string;
			slug: string;
			shortDescription?: string;
			description?: string;
			brandName?: string;
			seoTitle?: string;
			seoDescription?: string;
			tags?: string;
		}
	>;
	type: string;
	status: string;
	taxRate: string;
	minQuantity: number;
	maxQuantity?: number;
	isFeatured: boolean;
	trackStock: boolean;
	allowBackorders: boolean;

	variants?: ProductVariantFormValues[];
};

// Extend schema with proper types
export const productFormSchema = insertProductSchema
	.omit({
		organizationId: true,
		createdAt: true,
		updatedAt: true,
		deletedAt: true,
	})
	.extend({
		id: z.string().optional(),
		collectionIds: z.array(z.string()).optional(),
		brandId: z.string().nullable().optional(),
		images: z
			.array(
				z.object({
					key: z.string(),
					url: z.string(),
					name: z.string(),
					size: z.number(),
					type: z.string(),
				}),
			)
			.optional(),
		thumbnailImage: z
			.object({
				key: z.string(),
				url: z.string(),
				name: z.string(),
				size: z.number(),
				type: z.string(),
			})
			.nullable()
			.optional(),
		price: z.coerce.number().min(0, "Price must be positive").default(0),
		cost: z.coerce.number().min(0, "Cost must be positive").optional(),
		compareAtPrice: z.coerce
			.number()
			.min(0, "Compare at price must be positive")
			.optional(),
		translations: z.preprocess(
			(val) => {
				if (!val || typeof val !== "object") return val;
				// biome-ignore lint/suspicious/noExplicitAny: <>
				const castedVal = val as Record<string, any>;
				// biome-ignore lint/suspicious/noExplicitAny: <>
				const cleanVal: Record<string, any> = {};
				Object.keys(castedVal).forEach((key) => {
					const value = castedVal[key];
					// Check if the object has any meaningful values
					const hasValues = Object.values(value).some(
						(v) => v !== undefined && v !== "" && v !== null,
					);
					if (hasValues) {
						cleanVal[key] = value;
					}
				});
				return cleanVal;
			},
			z.record(
				z.string(),
				z.object({
					name: z.string().min(1, "Name is required"),
					slug: z.string().min(1, "Slug is required"),
					shortDescription: z.string().optional(),
					description: z.string().optional(),
					brandName: z.string().optional(),
					seoTitle: z
						.string()
						.max(60, "SEO title should be under 60 characters")
						.optional(),
					seoDescription: z
						.string()
						.max(160, "SEO description should be under 160 characters")
						.optional(),
					tags: z.string().optional(),
				}),
			),
		),
		variants: z
			.array(
				z.object({
					id: z.string().optional(),
					sku: z.string().min(1, "SKU is required"),
					price: z.coerce.number().min(0, "Price must be positive"),
					cost: z.coerce.number().min(0, "Cost must be positive").optional(),
					compareAtPrice: z.coerce
						.number()
						.min(0, "Compare at price must be positive")
						.optional(),
					reorderPoint: z.coerce.number().min(0).optional(),
					reorderQuantity: z.coerce.number().min(0).optional(),
					maxStock: z.coerce.number().min(0, "Stock must be positive"),
					weightKg: z.coerce.number().optional(),
					barcode: z.string().optional(),
					isActive: z.boolean().default(true),
					translations: z
						.array(
							z.object({
								languageCode: z.string(),
								name: z.string().optional(),
								attributes: z.record(z.string(), z.string()).optional(),
							}),
						)
						.optional(),
					displayName: z.string().optional(),
					optionValues: z.record(z.string(), z.string()).optional(),
				}),
			)
			.optional(),
	});

export type ProductFormSchema = z.infer<typeof productFormSchema>;
