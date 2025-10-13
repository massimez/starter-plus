"use client";

import { insertProductSchema } from "starter-plus-server/hc";
import { z } from "zod";
import {
	type ProductCategory,
	useProductCategories,
} from "@/app/[lang]/dashboard/store/product-categories/hooks/use-product-categories";
import { FormBuilder } from "@/components/form/form-builder";
import type { FormTabConfig } from "@/components/form/form-builder/types";
import { ProductImagesSlot } from "./product-images-slot";

export type ProductFormValues = {
	id?: string;
	categoryId?: string;
	brandId?: string | null;
	images?: Array<{
		key: string;
		url: string;
		name: string;
		size: number;
		type: string;
	}>;
	thumbnailImage?: {
		key: string;
		url: string;
		name: string;
		size: number;
		type: string;
	};
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
	isActive: boolean;
};

// Extend schema with proper types
const productFormSchema = insertProductSchema
	.omit({
		organizationId: true,
		createdAt: true,
		updatedAt: true,
		deletedAt: true,
	})
	.extend({
		id: z.string().optional(),
		categoryId: z.string().optional(),
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
		translations: z.record(
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
	});

interface ProductFormProps {
	onSubmit: (values: ProductFormValues) => Promise<void>;
	initialValues?: Partial<ProductFormValues>;
	selectedLanguage: string;
	brands?: Array<{ id: string; name: string }>;
}

export const ProductForm = ({
	onSubmit,
	initialValues,
	selectedLanguage,
	brands = [],
}: ProductFormProps) => {
	const { data: categoriesResponse, isLoading: isLoadingCategories } =
		useProductCategories();

	const categoryOptions =
		categoriesResponse?.data?.map((category: ProductCategory) => ({
			label: category.name,
			value: category.id,
		})) || [];

	const brandOptions = brands.map((brand) => ({
		label: brand.name,
		value: brand.id,
	}));

	const tabs: FormTabConfig<ProductFormValues>[] = [
		{
			key: "general",
			labelKey: "General",
			items: [
				{
					itemType: "field",
					name: `translations.${selectedLanguage}.name` as any,
					labelKey: "Product Name",
					type: "text",
					placeholderKey: "e.g., Premium Notebook",
					gridCols: 12,
					helperText: "Enter a clear, descriptive name for your product",
				},
				{
					itemType: "field",
					name: `translations.${selectedLanguage}.slug` as any,
					labelKey: "Slug",
					type: "text",
					placeholderKey: "premium-notebook",
					gridCols: 12,
					helperText:
						"URL-friendly version (auto-generated from name if left empty)",
				},
				{
					itemType: "slot",
					slotId: "product-images",
					component: ProductImagesSlot,
					gridCols: 12,
				},
				{
					itemType: "field",
					name: `translations.${selectedLanguage}.shortDescription` as any,
					labelKey: "Short Description",
					type: "textarea",
					placeholderKey: "A brief description shown in product listings",
					required: false,
					gridCols: 12,
					helperText:
						"Keep it concise - this appears in product cards and previews",
				},
				{
					itemType: "field",
					name: `translations.${selectedLanguage}.description` as any,
					labelKey: "Full Description",
					type: "textarea",
					placeholderKey:
						"Detailed product description with all features and benefits",
					required: false,
					gridCols: 12,
				},

				{
					itemType: "field",
					name: "brandId",
					labelKey: "Brand",
					type: "select",
					placeholderKey: "Select a brand",
					options: [
						{ label: "No brand", value: "--no-brand--" },
						...brandOptions,
					],
					required: false,
					gridCols: 6,
					transformValue: {
						toForm: (value) => value ?? "--no-brand--",
						fromForm: (value) => (value === "--no-brand--" ? undefined : value),
					},
				},
				{
					itemType: "field",
					name: "categoryId",
					labelKey: "Category",
					type: "select",
					placeholderKey: "Select a category",
					options: isLoadingCategories
						? [
								{
									label: "Loading categories...",
									value: "--loading--",
									disable: true,
								},
							]
						: [
								{ label: "No category", value: "--no-category--" },
								...categoryOptions,
							],
					required: false,
					gridCols: 6,
					transformValue: {
						toForm: (value) => value ?? "--no-category--",
						fromForm: (value) =>
							value === "--no-category--" ? undefined : value,
					},
				},
			],
		},
		{
			key: "settings",
			labelKey: "Settings",
			items: [
				{
					itemType: "field",
					name: "type",
					labelKey: "Product Type",
					type: "select",
					options: [
						{
							label: "Simple Product",
							value: "simple",
							helperText: "Single product without variants",
						},
						{
							label: "Variable Product",
							value: "variable",
							helperText: "Product with variants (size, color, etc.)",
						},
						{
							label: "Digital Product",
							value: "digital",
							helperText: "Downloadable or virtual product",
						},
					],
					gridCols: 6,
					helperText:
						"Choose 'Variable' to add size, color, or material options",
				},
				{
					itemType: "field",
					name: "status",
					labelKey: "Status",
					type: "select",
					options: [
						{ label: "Draft", value: "draft" },
						{ label: "Active", value: "active" },
						{ label: "Inactive", value: "inactive" },
						{ label: "Archived", value: "archived" },
					],
					gridCols: 6,
				},
				{
					itemType: "field",
					name: "taxRate",
					labelKey: "Tax Rate (%)",
					type: "number",
					placeholderKey: "0.00",
					gridCols: 6,
					helperText: "Enter as decimal (e.g., 20% = 0.20)",
				},
				{
					itemType: "field",
					name: "minQuantity",
					labelKey: "Minimum Order Quantity",
					type: "number",
					placeholderKey: "1",
					gridCols: 6,
					helperText: "Minimum quantity customers can purchase",
				},
				{
					itemType: "field",
					name: "maxQuantity",
					labelKey: "Maximum Order Quantity",
					type: "number",
					placeholderKey: "e.g., 100",
					required: false,
					gridCols: 6,
					helperText: "Leave empty for no limit",
				},
				{
					itemType: "field",
					name: "isFeatured",
					labelKey: "Featured Product",
					type: "switch",
					gridCols: 6,
					helperText: "Show in featured sections",
				},
				{
					itemType: "field",
					name: "trackStock",
					labelKey: "Track Inventory",
					type: "switch",
					gridCols: 6,
					helperText: "Monitor stock levels",
				},
				{
					itemType: "field",
					name: "allowBackorders",
					labelKey: "Allow Backorders",
					type: "switch",
					gridCols: 6,
					helperText: "Accept orders when out of stock",
				},
				{
					itemType: "field",
					name: "isActive",
					labelKey: "Is Active",
					type: "switch",
					gridCols: 6,
					helperText: "Product is visible and purchasable",
				},
			],
		},
		{
			key: "seo",
			labelKey: "SEO",
			items: [
				{
					itemType: "field",
					name: `translations.${selectedLanguage}.seoTitle` as any,
					labelKey: "SEO Title",
					type: "text",
					placeholderKey: "Optimized title for search engines",
					required: false,
					gridCols: 12,
					helperText:
						"Recommended: 50-60 characters. Leave empty to use product name",
				},
				{
					itemType: "field",
					name: `translations.${selectedLanguage}.seoDescription` as any,
					labelKey: "SEO Meta Description",
					type: "textarea",
					placeholderKey: "Description that appears in search results",
					required: false,
					gridCols: 12,
					helperText:
						"Recommended: 150-160 characters. Should entice clicks from search results",
				},
				{
					itemType: "field",
					name: `translations.${selectedLanguage}.tags` as any,
					labelKey: "Product Tags",
					type: "text",
					placeholderKey: "notebook, premium, office, stationery",
					required: false,
					gridCols: 12,
					helperText:
						"Comma-separated tags for better categorization and search",
				},
			],
		},
	];

	return (
		<FormBuilder
			config={{
				schema: productFormSchema,
				tabs: tabs,
				defaultValues: {
					status: "draft",
					type: "simple",
					taxRate: "0.00",
					minQuantity: 1,
					isFeatured: false,
					trackStock: true,
					allowBackorders: false,
					isActive: true,
					...initialValues,
					translations: initialValues?.translations || {},
				},
				gridLayout: true,
			}}
			onSubmit={onSubmit}
		/>
	);
};
