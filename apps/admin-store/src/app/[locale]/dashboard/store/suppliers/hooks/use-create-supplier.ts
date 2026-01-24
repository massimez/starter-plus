import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hc } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import type { TAddress } from "../../orders/_components/types";

export type SupplierFormData = {
	name: string;
	email?: string;
	phone?: string;
	address?: string;
	city?: string;
	country?: string;
	contactPerson?: string;
	website?: string;
	paymentTerms?: string;
	leadTimeDays?: number;
	currency?: string;
	rating?: number;
	isActive?: boolean;
};

export const useCreateSupplier = () => {
	const queryClient = useQueryClient();
	const activeOrg = authClient.useActiveOrganization();

	return useMutation({
		mutationFn: async (data: SupplierFormData) => {
			if (!activeOrg.data?.id) {
				throw new Error("Active organization ID is not available.");
			}

			const apiData = {
				organizationId: activeOrg.data.id,
				name: data.name,
				email: data.email,
				phone: data.phone,
				contactPerson: data.contactPerson,
				website: data.website,
				paymentTerms: data.paymentTerms,
				leadTimeDays: data.leadTimeDays,
				currency: data.currency,
				isActive: data.isActive,
				address:
					data.address || data.city || data.country
						? ({
								street: data.address,
								city: data.city,
								country: data.country,
							} as TAddress)
						: undefined,
				rating:
					typeof data.rating === "number" ? data.rating.toString() : undefined,
			};

			const response = await hc.api.store.suppliers.$post({
				json: apiData,
			});

			if (!response.ok) {
				throw new Error("Failed to create supplier");
			}

			return response.json();
		},
		onSuccess: () => {
			toast.success("Supplier created successfully!");
			queryClient.invalidateQueries({ queryKey: ["suppliers"] });
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create supplier");
		},
	});
};
