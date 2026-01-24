import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hc as apiClient } from "@/lib/api-client";
import type { ProductFormValues } from "../_components/product-schema";

interface UpdateProductPayload {
	productId: string;
	data: Partial<ProductFormValues>;
}

export function useUpdateProduct() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			productId,
			data,
			deletedVariantIds,
		}: UpdateProductPayload & { deletedVariantIds?: string[] }) => {
			const { translations, variants, ...productData } = data;

			const transformedTranslations = translations
				? Object.entries(translations).map(([languageCode, translation]) => ({
						languageCode,
						...translation,
					}))
				: undefined;

			const response = await apiClient.api.store.products[":id"].$put({
				param: { id: productId },
				json: {
					...productData,
					translations: transformedTranslations,
				},
			});

			if (!response.ok) {
				throw new Error("Failed to update product");
			}

			// Handle variant deletions
			if (deletedVariantIds && deletedVariantIds.length > 0) {
				// Only delete variants that have valid database IDs (UUIDs)
				// Filter out any frontend-generated IDs that were never saved
				const validVariantIds = deletedVariantIds.filter((id) => {
					// Check if it's a valid UUID format (basic check)
					const uuidRegex =
						/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
					return uuidRegex.test(id);
				});

				if (validVariantIds.length > 0) {
					await Promise.all(
						validVariantIds.map(async (variantId) => {
							try {
								await apiClient.api.store["product-variants"][":id"].$delete({
									param: { id: variantId },
								});
							} catch (error) {
								console.error(`Failed to delete variant ${variantId}:`, error);
								// Continue with other deletions even if one fails
							}
						}),
					);
				}
			}

			// Handle variant updates/creation
			if (variants && Array.isArray(variants)) {
				await Promise.all(
					// biome-ignore lint/suspicious/noExplicitAny: variant type from form doesn't match API type exactly
					variants.map(async (variant: any) => {
						// Build translations array from displayName and optionValues
						const variantTranslations = variant.translations || [];

						// Only update attributes (optionValues) in translations, preserve user-edited names
						if (variant.optionValues) {
							// Get all unique language codes from existing translations or use a default
							const languageCodes =
								variantTranslations.length > 0
									? variantTranslations.map(
											(t: { languageCode: string }) => t.languageCode,
										)
									: ["en"]; // fallback to English

							// Update or create translation for each language
							languageCodes.forEach((langCode: string) => {
								const existingTranslation = variantTranslations.find(
									(t: { languageCode: string }) => t.languageCode === langCode,
								);

								if (existingTranslation) {
									// Only update attributes, keep the user-edited name
									existingTranslation.attributes = variant.optionValues;
								} else {
									// For new translations, use displayName as default
									variantTranslations.push({
										languageCode: langCode,
										name: variant.displayName || "",
										attributes: variant.optionValues,
									});
								}
							});
						}

						const cleanVariant = {
							...variant,
							price: Number(variant.price),
							cost: Number(variant.cost || 0),
							compareAtPrice: Number(variant.compareAtPrice || 0),
							reorderPoint: Number(variant.reorderPoint || 0),
							reorderQuantity: Number(variant.reorderQuantity || 0),
							weightKg: variant.weightKg ? Number(variant.weightKg) : undefined,
							translations:
								variantTranslations.length > 0
									? variantTranslations
									: undefined,
						};

						// Remove frontend-only fields
						delete cleanVariant.displayName;
						delete cleanVariant.optionValues;

						if (variant.id) {
							await apiClient.api.store["product-variants"][":id"].$put({
								param: { id: variant.id },
								json: cleanVariant,
							});
						} else {
							await apiClient.api.store["product-variants"].$post({
								json: { ...cleanVariant, productId },
							});
						}
					}),
				);
			}

			return response.json();
		},
		onSuccess: (_data, variables) => {
			// Invalidate the products list
			queryClient.invalidateQueries({ queryKey: ["products"] });
			// Invalidate the specific product to ensure fresh data when navigating back
			queryClient.invalidateQueries({
				queryKey: ["product", variables.productId],
			});
			toast.success("Product updated successfully!");
		},
		onError: (error) => {
			toast.error("Failed to update product.", {
				description: error.message,
			});
		},
	});
}
