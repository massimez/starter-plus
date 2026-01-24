"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { use } from "react";
import { PageDashboardHeader } from "@/app/[locale]/(landing)/_components/sections/page-dashboard-header";
import { hc } from "@/lib/api-client";
import { ZoneForm } from "../../_components/zone-form";

interface PageProps {
	params: Promise<{
		locale: string;
	}>;
}

export default function NewShippingZonePage({ params }: PageProps) {
	const { locale } = use(params);
	const router = useRouter();
	const queryClient = useQueryClient();

	// biome-ignore lint/suspicious/noExplicitAny: generic form data
	const handleSubmit = async (data: any) => {
		try {
			const res = await hc.api.store["shipping-zones"].$post({
				json: data,
			});

			const json = await res.json();

			if ("error" in json && json.error) {
				throw new Error(json.error.message);
			}

			queryClient.invalidateQueries({ queryKey: ["shipping-zones"] });
			router.push(`/${locale}/dashboard/store/shipping/zones`);
		} catch (error) {
			console.error("Failed to create shipping zone:", error);
		}
	};

	return (
		<div className="space-y-6 p-6">
			<PageDashboardHeader
				title="New Shipping Zone"
				description="Create a new geographic zone for shipping."
			/>
			<div className="">
				<ZoneForm onSubmit={handleSubmit} />
			</div>
		</div>
	);
}
