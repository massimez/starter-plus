"use client";

import { useQueryClient } from "@tanstack/react-query";
import { use } from "react";
import { PageDashboardHeader } from "@/app/[locale]/(landing)/_components/sections/page-dashboard-header";
import { useRouter } from "@/i18n/navigation";
import { hc } from "@/lib/api-client";
import { ShippingForm } from "../_components/shipping-form";
import { ShippingMethodZones } from "../_components/shipping-method-zones";
import { useShippingMethod } from "../_components/use-shipping";

export default function EditShippingMethodPage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>;
}) {
	const { id } = use(params);

	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: shippingMethod, isLoading } = useShippingMethod(id);

	// biome-ignore lint/suspicious/noExplicitAny: generic form data
	const handleSubmit = async (data: any) => {
		try {
			const res = await hc.api.store["shipping-methods"][":id"].$put({
				param: { id },
				json: data,
			});

			const json = await res.json();

			if ("error" in json && json.error) {
				throw new Error(json.error.message);
			}

			queryClient.invalidateQueries({ queryKey: ["shipping-methods"] });
			queryClient.invalidateQueries({ queryKey: ["shipping-method", id] });
			router.push("/dashboard/store/shipping");
		} catch (error) {
			console.error("Failed to update shipping method:", error);
		}
	};

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (!shippingMethod) {
		return <div>Shipping method not found</div>;
	}

	return (
		<div className="space-y-6 p-6">
			<PageDashboardHeader
				title="Edit Shipping Method"
				description={`Edit ${shippingMethod.name}`}
			/>
			<div className="mx-auto max-w-2xl space-y-8">
				<ShippingForm initialData={shippingMethod} onSubmit={handleSubmit} />
				<div className="border-t pt-8">
					<ShippingMethodZones methodId={id} />
				</div>
			</div>
		</div>
	);
}
