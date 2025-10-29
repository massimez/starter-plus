import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { hc } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";

const transactionSchema = z.object({
	productVariantId: z.string().min(1),
	locationId: z.string().min(1),
	quantityChange: z.number(),
	reason: z.string().min(1),
	supplierId: z.string().optional(),
	batchId: z.string().optional(),
	unitCost: z.number().optional(),
	referenceId: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export const useCreateTransaction = () => {
	const queryClient = useQueryClient();
	const activeOrg = authClient.useActiveOrganization();

	return useMutation({
		mutationFn: async (data: TransactionFormData) => {
			if (!activeOrg.data?.id) {
				throw new Error("Active organization ID is not available.");
			}

			const apiData = {
				...data,
				organizationId: activeOrg.data.id,
				unitCost: data.unitCost?.toString(),
			};

			const response = await hc.api.store.inventory["stock-transactions"].$post(
				{
					json: apiData,
				},
			);

			if (!response.ok) {
				const errorText = await response
					.text()
					.catch(() => response.statusText);
				throw new Error(`Failed to create transaction: ${errorText}`);
			}

			const json = await response.json();

			if (json.error) {
				throw new Error(json.error.message || "Failed to create transaction");
			}

			return json.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["inventory"] });
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
		},
	});
};
