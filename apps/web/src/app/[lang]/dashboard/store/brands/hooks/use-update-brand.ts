import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hc } from "@/lib/api-client";
import type { BrandFormData } from "./use-create-brand";

export type { BrandFormData } from "./use-create-brand";

export const useUpdateBrand = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			data,
			brandId,
		}: {
			data: BrandFormData;
			brandId: string;
		}) => {
			if (!brandId) {
				throw new Error("Brand ID is required for update");
			}

			const apiData = {
				name: data.name,
				companyName: data.companyName,
				logo: data.logo,
				website: data.website,
				description: data.description,
				isActive: data.isActive,
			};

			const response = await hc.api.store.brands[":id"].$put({
				param: { id: brandId },
				json: apiData,
			});

			if (!response.ok) {
				throw new Error("Failed to update brand");
			}

			return response.json();
		},
		onSuccess: () => {
			toast.success("Brand updated successfully!");
			queryClient.invalidateQueries({ queryKey: ["brands"] });
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update brand");
		},
	});
};
