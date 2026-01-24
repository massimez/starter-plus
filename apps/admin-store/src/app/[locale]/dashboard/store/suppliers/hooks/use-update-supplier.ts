import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { TAddress } from "@/app/[locale]/dashboard/store/orders/_components/types";
import { hc } from "@/lib/api-client";
import type { SupplierFormData } from "./use-create-supplier";

export type { SupplierFormData } from "./use-create-supplier";

export const useUpdateSupplier = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			data,
			supplierId,
		}: {
			data: SupplierFormData;
			supplierId: string;
		}) => {
			if (!supplierId) {
				throw new Error("Supplier ID is required for update");
			}

			const apiData = {
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

			const response = await hc.api.store.suppliers[":id"].$put({
				param: { id: supplierId },
				json: apiData,
			});

			if (!response.ok) {
				throw new Error("Failed to update supplier");
			}

			return response.json();
		},
		onSuccess: () => {
			toast.success("Supplier updated successfully!");
			queryClient.invalidateQueries({ queryKey: ["suppliers"] });
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update supplier");
		},
	});
};
