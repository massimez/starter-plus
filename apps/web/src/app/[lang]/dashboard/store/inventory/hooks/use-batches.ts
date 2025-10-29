import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import z from "zod";
import { hc } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";

export const useBatches = (productVariantId: string) => {
	return useQuery({
		queryKey: ["batches", productVariantId],
		queryFn: async () => {
			const response = await hc.api.store.inventory.batches[
				":productVariantId"
			].$get({
				param: { productVariantId },
			});

			if (!response.ok) {
				const errorText = await response
					.text()
					.catch(() => response.statusText);
				throw new Error(`Failed to fetch batches: ${errorText}`);
			}

			const json = await response.json();

			if (json.error) {
				throw new Error(json.error.message || "Failed to fetch batches");
			}

			return json.data;
		},
		enabled: !!productVariantId,
	});
};

const batchSchema = z.object({
	productVariantId: z.string().min(1),
	batchNumber: z.string().min(1),
	expiryDate: z.date().optional(),
	locationId: z.string().min(1),
	quantity: z.number().min(0),
});

type BatchFormData = z.infer<typeof batchSchema>;

export const useCreateBatch = () => {
	const queryClient = useQueryClient();
	const activeOrg = authClient.useActiveOrganization();

	return useMutation({
		mutationFn: async (data: BatchFormData) => {
			if (!activeOrg.data?.id) {
				throw new Error("Active organization ID is not available.");
			}

			const apiData = {
				...data,
				organizationId: activeOrg.data.id,
			};

			const response = await hc.api.store.inventory.batches.$post({
				json: apiData,
			});

			if (!response.ok) {
				const errorText = await response
					.text()
					.catch(() => response.statusText);
				throw new Error(`Failed to create batch: ${errorText}`);
			}

			const json = await response.json();

			if (json.error) {
				throw new Error(json.error.message || "Failed to create batch");
			}

			return json.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["inventory"] });
			queryClient.invalidateQueries({ queryKey: ["batches"] });
		},
	});
};
