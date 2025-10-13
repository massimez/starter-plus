import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hc as apiClient } from "@/lib/api-client";
import type { ProductFormValues } from "../_components/product-form";

interface UpdateProductPayload {
	productId: string;
	data: Partial<ProductFormValues>;
}

export function useUpdateProduct() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ productId, data }: UpdateProductPayload) => {
			const { translations, ...productData } = data;

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
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
			toast.success("Product updated successfully!");
		},
		onError: (error) => {
			toast.error("Failed to update product.", {
				description: error.message,
			});
		},
	});
}
