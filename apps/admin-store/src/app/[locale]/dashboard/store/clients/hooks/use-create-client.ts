import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hc } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";

export type ClientFormData = {
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	preferredContactMethod?: "email" | "phone" | "sms";
	language?: string;
	timezone?: string;
	tags?: string[];
	notes?: string;
	marketingConsent?: boolean;
	gdprConsent?: boolean;
	isActive?: boolean;
	emailVerified?: boolean;
	phoneVerified?: boolean;
};

export const useCreateClient = () => {
	const queryClient = useQueryClient();
	const activeOrg = authClient.useActiveOrganization();

	return useMutation({
		mutationFn: async (data: ClientFormData) => {
			if (!activeOrg.data?.id) {
				throw new Error("Active organization ID is not available.");
			}

			const apiData = {
				organizationId: activeOrg.data.id,
				firstName: data.firstName,
				lastName: data.lastName,
				email: data.email,
				phone: data.phone,
				preferredContactMethod: data.preferredContactMethod,
				language: data.language,
				timezone: data.timezone,
				tags: data.tags,
				notes: data.notes,
				marketingConsent: data.marketingConsent,
				gdprConsent: data.gdprConsent,
				isActive: data.isActive ?? true,
				...(data.emailVerified !== undefined && {
					emailVerified: data.emailVerified,
				}),
				...(data.phoneVerified !== undefined && {
					phoneVerified: data.phoneVerified,
				}),
			};

			const response = await hc.api.store.clients.$post({
				json: apiData,
			});

			if (!response.ok) {
				throw new Error("Failed to create client");
			}

			return response.json();
		},
		onSuccess: () => {
			toast.success("Client created successfully!");
			queryClient.invalidateQueries({ queryKey: ["clients"] });
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create client");
		},
	});
};
