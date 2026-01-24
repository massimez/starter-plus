"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import { toast } from "sonner";
import { DEFAULT_LOCALE } from "@/constants/locales";
import { hc } from "@/lib/api-client";
import { useActiveOrganization } from "@/lib/auth-client";
import { ProductEditForm } from "../_components/product-edit-form";
import type { ProductFormValues } from "../_components/product-schema";
import type { Product, ProductVariant } from "../_components/use-products";
import type { VariantOption } from "../_components/variant-options";
import { useUpdateProduct } from "../hooks/use-update-product";

const extractOptionsFromVariants = (
	variants: ProductVariant[],
	selectedLanguage: string,
): VariantOption[] => {
	const optionsMap = new Map<string, Set<string>>();

	variants.forEach((variant) => {
		const attributes =
			variant.translations?.find((t) => t.languageCode === selectedLanguage)
				?.attributes || variant.translations?.[0]?.attributes;

		if (attributes) {
			Object.entries(attributes).forEach(([key, value]) => {
				if (!optionsMap.has(key)) {
					optionsMap.set(key, new Set());
				}
				optionsMap.get(key)?.add(value);
			});
		}
	});

	return Array.from(optionsMap.entries()).map(([name, values], index) => ({
		id: `option-${index}`,
		name,
		values: Array.from(values),
	}));
};

export default function EditProductPage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>;
}) {
	const { locale, id } = use(params);
	const { data: activeOrganizationData } = useActiveOrganization();
	const selectedLanguage = locale || DEFAULT_LOCALE;

	const { data: product, isLoading } = useQuery({
		queryKey: ["product", id],
		queryFn: async () => {
			const res = await hc.api.store.products[":id"].$get({
				param: { id },
			});
			if (!res.ok) {
				throw new Error("Failed to fetch product");
			}
			const json = await res.json();
			return json.data as unknown as Product;
		},
	});

	const initialOptions = product?.variants
		? extractOptionsFromVariants(product.variants, selectedLanguage)
		: [];

	const getInitialValues = (
		product: Product,
	): Partial<ProductFormValues> | undefined => {
		if (!product) return undefined;

		// Convert translations array to record format
		// biome-ignore lint/suspicious/noExplicitAny: <>
		const translationsRecord: Record<string, any> = {};

		if (product.translations && Array.isArray(product.translations)) {
			// biome-ignore lint/suspicious/noExplicitAny: <>
			product.translations.forEach((translation: any) => {
				translationsRecord[translation.languageCode] = {
					name: translation.name || "",
					slug: translation.slug || "",
					shortDescription: translation.shortDescription,
					description: translation.description,
					brandName: translation.brandName,
					seoTitle: translation.seoTitle,
					seoDescription: translation.seoDescription,
					tags: translation.tags,
				};
			});
		}

		// Find images from the current language translation or fallback to the first one with images
		const translationWithImages =
			product.translations?.find((t) => t.languageCode === selectedLanguage) ||
			product.translations?.find((t) => t.images && t.images.length > 0);

		const formattedImages =
			translationWithImages?.images?.map((img) => ({
				key: img.url, // Use URL as key since we don't have the original key
				url: img.url,
				name: img.alt || "Product Image",
				size: 0, // Mock size as we don't have it
				type: "image/jpeg", // Mock type
			})) || [];

		return {
			...product,
			maxQuantity: product.maxQuantity ?? undefined,
			translations: translationsRecord,
			images: formattedImages,
			thumbnailImage: undefined, // TODO: Handle thumbnail image
			collectionIds: product.collectionIds || [],
			brandId: product.brandId || undefined,
			variants: product.variants?.map((variant) => ({
				id: variant.id,
				sku: variant.sku,
				price:
					typeof variant.price === "string"
						? Number.parseFloat(variant.price)
						: variant.price,
				maxStock: variant.maxStock || 0,
				weightKg: variant.weightKg
					? typeof variant.weightKg === "string"
						? Number.parseFloat(variant.weightKg)
						: variant.weightKg
					: undefined,
				barcode: undefined,
				isActive: variant.isActive ?? true,
				translations: variant.translations || [],
				displayName:
					variant.translations?.find((t) => t.languageCode === selectedLanguage)
						?.name ||
					variant.translations?.[0]?.name ||
					"Variant",
				optionValues:
					variant.translations?.find((t) => t.languageCode === selectedLanguage)
						?.attributes ||
					variant.translations?.[0]?.attributes ||
					{},
			})),
		};
	};

	const { mutateAsync: updateProduct, isPending } = useUpdateProduct();

	const onSubmit = async (
		values: ProductFormValues,
		deletedVariantIds: string[],
	) => {
		if (!activeOrganizationData?.id) {
			toast.error("Organization ID missing");
			return;
		}

		try {
			await updateProduct({
				productId: id,
				data: values,
				deletedVariantIds,
			});
			// Stay on the edit page after saving
		} catch (error) {
			console.error("Form submission caught an error:", error);
			// Toast is handled in the hook
		}
	};

	if (isLoading) return <div>Loading...</div>;
	if (!product) return <div>Product not found</div>;

	return (
		<div className="p-6">
			<ProductEditForm
				initialValues={getInitialValues(product)}
				initialOptions={initialOptions}
				onSubmit={onSubmit}
				selectedLanguage={selectedLanguage}
				isSubmitting={isPending}
			/>
		</div>
	);
}
