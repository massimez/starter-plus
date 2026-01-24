import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hc } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import type { ClientFormData } from "./use-create-client";

export const useUpdateClient = () => {
	const queryClient = useQueryClient();
	const activeOrg = authClient.useActiveOrganization();

	return useMutation({
		mutationFn: async ({
			data,
			clientId,
		}: {
			data: ClientFormData;
			clientId: string;
		}) => {
			if (!activeOrg.data?.id) {
				throw new Error("Active organization ID is not available.");
			}

			const apiData = {
				firstName: data.firstName,
				lastName: data.lastName,
				email: data.email,
				...(data.phone && { phone: data.phone }),
				preferredContactMethod: data.preferredContactMethod,
				language: data.language,
				timezone: data.timezone,
				tags: data.tags,
				notes: data.notes,
				marketingConsent: data.marketingConsent,
				gdprConsent: data.gdprConsent,
				isActive: data.isActive,
				...(data.emailVerified !== undefined && {
					emailVerified: data.emailVerified,
				}),
				...(data.phoneVerified !== undefined && {
					phoneVerified: data.phoneVerified,
				}),
			};

			const response = await hc.api.store.clients[":id"].admin.$put({
				param: { id: clientId },
				json: apiData,
			});

			if (!response.ok) {
				throw new Error("Failed to update client");
			}

			return response.json();
		},
		onSuccess: () => {
			toast.success("Client updated successfully!");
			queryClient.invalidateQueries({ queryKey: ["clients"] });
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update client");
		},
	});
};
