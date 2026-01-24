"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PageDashboardHeader } from "@/app/[locale]/(landing)/_components/sections/page-dashboard-header";
import { hc } from "@/lib/api-client";
import { useShippingZone } from "../../_components/use-zones";
import { ZoneForm } from "../../_components/zone-form";

interface PageProps {
	params: {
		locale: string;
		id: string;
	};
}

export default function EditShippingZonePage({
	params: { locale, id },
}: PageProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: zone, isLoading } = useShippingZone(id);

	// biome-ignore lint/suspicious/noExplicitAny: generic form data
	const handleSubmit = async (data: any) => {
		try {
			const res = await hc.api.store["shipping-zones"][":id"].$put({
				param: { id },
				json: data,
			});

			const json = await res.json();

			if ("error" in json && json.error) {
				throw new Error(json.error.message);
			}

			queryClient.invalidateQueries({ queryKey: ["shipping-zones"] });
			queryClient.invalidateQueries({ queryKey: ["shipping-zone", id] });
			router.push(`/${locale}/dashboard/store/shipping/zones`);
		} catch (error) {
			console.error("Failed to update shipping zone:", error);
		}
	};

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (!zone) {
		return <div>Shipping zone not found</div>;
	}

	return (
		<div className="space-y-6 p-6">
			<PageDashboardHeader
				title="Edit Shipping Zone"
				description={`Edit ${zone.name}`}
			/>
			<div className="">
				<ZoneForm initialData={zone} onSubmit={handleSubmit} />
			</div>
		</div>
	);
}
