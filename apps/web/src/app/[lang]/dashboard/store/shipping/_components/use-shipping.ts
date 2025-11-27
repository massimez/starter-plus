import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

export type ShippingMethod = {
	id: string;
	name: string;
	code: string;
	description: string | null;
	basePrice: string;
	currency: string;
	minOrderAmount: string | null;
	maxOrderAmount: string | null;
	freeShippingThreshold: string | null;
	estimatedMinDays: string | null;
	estimatedMaxDays: string | null;
	carrier: string | null;
	trackingUrl: string | null;
	isActive: boolean;
	isDefault: boolean;
	createdAt: string;
	updatedAt: string | null;
};

export const useShippingMethods = () => {
	return useQuery({
		queryKey: ["shipping-methods"],
		queryFn: async () => {
			const res = await hc.api.store["shipping-methods"].$get({
				query: { limit: "100", offset: "0" },
			});
			const json = await res.json();
			if ("error" in json && json.error) {
				throw new Error(json.error.message);
			}
			return json.data.data as ShippingMethod[];
		},
	});
};

export const useShippingMethod = (id: string) => {
	return useQuery({
		queryKey: ["shipping-method", id],
		queryFn: async () => {
			const res = await hc.api.store["shipping-methods"][":id"].$get({
				param: { id },
			});
			const json = await res.json();
			if ("error" in json && json.error) {
				throw new Error(json.error.message);
			}
			return json.data as ShippingMethod;
		},
		enabled: !!id,
	});
};

export type ShippingMethodZone = {
	id: string;
	shippingMethodId: string;
	shippingZoneId: string;
	priceOverride: string | null;
	estimatedMinDaysOverride: string | null;
	estimatedMaxDaysOverride: string | null;
	isActive: boolean;
};

export const useShippingMethodZones = (methodId: string) => {
	return useQuery({
		queryKey: ["shipping-method-zones", methodId],
		queryFn: async () => {
			const res = await hc.api.store["shipping-methods"][
				":methodId"
			].zones.$get({
				param: { methodId },
			});
			const json = await res.json();
			if ("error" in json && json.error) {
				throw new Error(json.error.message);
			}
			return json.data as ShippingMethodZone[];
		},
		enabled: !!methodId,
	});
};

export type CreateShippingMethodZone = Omit<ShippingMethodZone, "id">;
export type UpdateShippingMethodZone = Partial<CreateShippingMethodZone>;

export const useCreateShippingMethodZone = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (json: Omit<ShippingMethodZone, "id">) => {
			const res = await hc.api.store["shipping-method-zones"].$post({
				json,
			});
			const data = await res.json();
			if ("error" in data && data.error) {
				throw new Error(
					data.error?.message || "Failed to create shipping method zone",
				);
			}
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["shipping-method-zones"] });
		},
	});
};

export const useUpdateShippingMethodZone = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			id,
			json,
		}: {
			id: string;
			json: Partial<ShippingMethodZone>;
		}) => {
			const res = await hc.api.store["shipping-method-zones"][":id"].$put({
				param: { id },
				json,
			});
			const data = await res.json();
			if ("error" in data && data.error) {
				throw new Error(
					data.error?.message || "Failed to update shipping method zone",
				);
			}
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["shipping-method-zones"] });
		},
	});
};

export const useDeleteShippingMethodZone = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const res = await hc.api.store["shipping-method-zones"][":id"].$delete({
				param: { id },
			});
			const data = await res.json();
			if ("error" in data && data.error) {
				throw new Error(
					data.error?.message || "Failed to delete shipping method zone",
				);
			}
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["shipping-method-zones"] });
		},
	});
};
