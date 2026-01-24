"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { use as ReactUse } from "react";

import { PageDashboardHeader } from "@/app/[locale]/(landing)/_components/sections/page-dashboard-header";
import { hc } from "@/lib/api-client";
import { ShippingForm } from "../_components/shipping-form";

interface PageProps {
	params: Promise<{
		locale: string;
	}>;
}

export default function NewShippingMethodPage({ params }: PageProps) {
	const { locale } = ReactUse(params);
	const router = useRouter();
	const queryClient = useQueryClient();

	// biome-ignore lint/suspicious/noExplicitAny: generic form data
	const handleSubmit = async (data: any) => {
		try {
			const res = await hc.api.store["shipping-methods"].$post({
				json: data,
			});

			const json = await res.json();

			if ("error" in json && json.error) {
				throw new Error(json.error.message);
			}

			queryClient.invalidateQueries({ queryKey: ["shipping-methods"] });
			router.push(`/${locale}/dashboard/store/shipping`);
		} catch (error) {
			console.error("Failed to create shipping method:", error);
			// You might want to show a toast notification here
		}
	};

	return (
		<div className="space-y-6 p-6">
			<PageDashboardHeader
				title="New Shipping Method"
				description="Create a new shipping method for your store."
			/>
			<div className="">
				<ShippingForm onSubmit={handleSubmit} />
			</div>
		</div>
	);
}
