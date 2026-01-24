import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hc } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";

export type BrandFormData = {
	name: string;
	companyName?: string;
	logo?: string;
	website?: string;
	description?: string;
	isActive?: boolean;
};

export const useCreateBrand = () => {
	const queryClient = useQueryClient();
	const activeOrg = authClient.useActiveOrganization();

	return useMutation({
		mutationFn: async (data: BrandFormData) => {
			if (!activeOrg.data?.id) {
				throw new Error("Active organization ID is not available.");
			}

			const apiData = {
				organizationId: activeOrg.data.id,
				name: data.name,
				companyName: data.companyName,
				logo: data.logo,
				website: data.website,
				description: data.description,
				isActive: data.isActive,
			};

			const response = await hc.api.store.brands.$post({
				json: apiData,
			});

			if (!response.ok) {
				throw new Error("Failed to create brand");
			}

			return response.json();
		},
		onSuccess: () => {
			toast.success("Brand created successfully!");
			queryClient.invalidateQueries({ queryKey: ["brands"] });
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create brand");
		},
	});
};
