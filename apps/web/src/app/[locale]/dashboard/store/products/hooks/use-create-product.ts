"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { hc as apiClient } from "@/lib/api-client";
import { useActiveOrganization } from "@/lib/auth-client";
import type { ProductFormValues } from "../_components/product-schema";

export function useCreateProduct(locale: string) {
	const queryClient = useQueryClient();
	const router = useRouter();
	const { data: activeOrganizationData } = useActiveOrganization();

	return useMutation({
		mutationFn: async (values: ProductFormValues) => {
			const { processImages, createVariants } = await import(
				"../new/product-helpers"
			);

			// 1. Process Images
			const images = await processImages(values);

			const { variants, ...restValues } = values;

			// 2. Prepare Payload
			const translationsPayload = Object.entries(values.translations || {}).map(
				([langCode, translation]) => ({
					...translation,
					languageCode: langCode,
				}),
			);

			const payload = {
				...restValues,
				translations: translationsPayload,
				images: images
					? images
							.filter((img): img is NonNullable<typeof img> => !!img)
							.map((img) => ({
								key: img.key,
								url: img.url,
								name: img.name,
								size: img.size,
								type: img.type,
							}))
					: undefined,
			};

			// 3. Create Product
			const response = await apiClient.api.store.products.$post({
				json: {
					organizationId: activeOrganizationData?.id || "",
					...payload,
				},
			});

			if (!response.ok) {
				const errorData = await response.json();
				const errorMessage =
					errorData.error?.message || "Failed to save product";
				throw new Error(errorMessage);
			}

			const responseData = await response.json();
			const productId = responseData.data?.id;

			// 4. Create Variants if any
			if (productId && variants && variants.length > 0) {
				await createVariants(productId, variants);
			}

			return responseData;
		},
		onSuccess: () => {
			toast.success("Product created successfully");
			queryClient.invalidateQueries({ queryKey: ["products"] });
			router.push(`/${locale}/dashboard/store/products`);
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to save product");
		},
	});
}
