import { useQuery } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

export type ShippingZone = {
	id: string;
	name: string;
	code: string;
	description: string | null;
	countries: string[] | null;
	states: string[] | null;
	cities: string[] | null;
	postalCodes: string[] | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
};

export const useShippingZones = () => {
	return useQuery({
		queryKey: ["shipping-zones"],
		queryFn: async () => {
			const res = await hc.api.store["shipping-zones"].$get({
				query: { limit: "100", offset: "0" },
			});
			const json = await res.json();
			if ("error" in json && json.error) {
				throw new Error(json.error.message);
			}
			return json.data.data as ShippingZone[];
		},
	});
};

export const useShippingZone = (id: string) => {
	return useQuery({
		queryKey: ["shipping-zone", id],
		queryFn: async () => {
			const res = await hc.api.store["shipping-zones"][":id"].$get({
				param: { id },
			});
			const json = await res.json();
			if ("error" in json && json.error) {
				throw new Error(json.error.message);
			}
			return json.data as ShippingZone;
		},
		enabled: !!id,
	});
};
