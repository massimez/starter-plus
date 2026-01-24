"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
	insertOrganizationInfoSchema,
	updateOrganizationInfoSchema,
} from "@workspace/server/schema";
import type { z } from "zod";
import { hc } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";

export const useGetLocations = (organizationId?: string) => {
	return useQuery({
		queryKey: ["organization", organizationId, "locations"],
		queryFn: async () => {
			const res = await hc.api.organizations.locations.$get();
			if (res.ok) {
				const data = await res.json();

				return data;
			}

			return null;
		},
		enabled: Boolean(organizationId),
		staleTime: 1000 * 60 * 5, // cache for 5 minutes (tune to your needs)
	});
};

export const useActiveOrganization = () => {
	const {
		data: activeOrganization,
		isPending: activeOrgLoading,
		refetch: refetchActiveOrganization,
	} = authClient.useActiveOrganization();
	return { activeOrganization, activeOrgLoading, refetchActiveOrganization };
};

export const useGetFullOrganization = (
	organizationId?: string,
	organizationSlug?: string,
	isEnabled?: boolean,
) => {
	return useQuery({
		queryKey: ["organization", organizationId, organizationSlug, "full"],
		queryFn: async () => {
			const { data, error } = await authClient.organization.getFullOrganization(
				{
					query: {
						organizationId: organizationId,
						organizationSlug: organizationSlug,
						membersLimit: 100,
					},
				},
			);

			if (error) {
				throw error;
			}

			return data;
		},
		enabled: isEnabled,
		staleTime: 1000 * 60 * 5,
	});
};

export const useGetOrganizationInfo = (organizationId: string) => {
	return useQuery({
		queryKey: ["organization", organizationId, "info"],
		queryFn: async () => {
			const res = await hc.api.organizations.info.$get();
			if (res.ok) {
				const result = await res.json();
				// Type guard to check if the response has data property
				if ("data" in result) {
					return result.data;
				}
				// Handle case where response has error property
				if ("error" in result) {
					throw new Error(result.error.message || JSON.stringify(result.error));
				}
			}
			return null;
		},
		enabled: Boolean(organizationId),
		staleTime: 1000 * 60 * 5,
	});
};

export const useUpdateOrganizationInfo = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			organizationId,
			organizationInfoId,
			...values
		}: { organizationId: string; organizationInfoId: string } & Partial<
			z.infer<typeof updateOrganizationInfoSchema>
		>) => {
			const res = await hc.api.organizations.info[":id"].$put({
				param: { id: organizationInfoId },
				json: { ...values, organizationId },
			});
			if (res.ok) {
				const data = await res.json();
				return data;
			}
			const errorData = await res.json();
			if ("error" in errorData && typeof errorData.error === "object") {
				throw new Error(
					errorData.error?.message || "Failed to update organization info",
				);
			}
			throw new Error("Failed to update organization info");
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["organization", variables.organizationId, "info"],
			});
		},
	});
};

export const useCreateOrganizationInfo = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			organizationId,
			...values
		}: { organizationId: string } & Partial<
			z.infer<typeof insertOrganizationInfoSchema>
		>) => {
			const res = await hc.api.organizations.info.$post({
				json: { ...values, organizationId },
			});
			if (res.ok) {
				const data = await res.json(); // data is the organization info object directly
				return data;
			}
			const errorData = await res.json();
			if ("error" in errorData && typeof errorData.error === "object") {
				throw new Error(
					errorData.error.message || "Failed to create organization info",
				);
			}
			throw new Error("Failed to create organization info");
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["organization", variables.organizationId, "info"],
			});
		},
	});
};

export const useResendInvitation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			email,
			role,
			organizationId,
		}: {
			email: string;
			role: Parameters<typeof authClient.organization.inviteMember>[0]["role"];
			organizationId: string;
		}) => {
			const res = await authClient.organization.inviteMember({
				email,
				role,
				organizationId,
				resend: true,
			});

			if (res.error) {
				throw new Error(res.error.message || "An unknown error occurred");
			}
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["organization"] });
		},
	});
};
