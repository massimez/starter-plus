"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { use as ReactUse } from "react";
import { PageDashboardHeader } from "@/app/[locale]/(landing)/_components/sections/page-dashboard-header";
import { hc } from "@/lib/api-client";
import { useShippingZones } from "../_components/use-zones";
import { ZoneList } from "../_components/zone-list";

interface PageProps {
	params: Promise<{
		locale: string;
	}>;
}

export default function ShippingZonesPage({ params }: PageProps) {
	const { locale } = ReactUse(params);
	const queryClient = useQueryClient();
	const { data: zones, isLoading } = useShippingZones();

	const handleDelete = async (id: string) => {
		await hc.api.store["shipping-zones"][":id"].$delete({
			param: { id },
		});
		queryClient.invalidateQueries({ queryKey: ["shipping-zones"] });
	};

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<PageDashboardHeader
					title="Shipping Zones"
					description="Manage geographic zones for shipping."
				/>
				<Link href={`/${locale}/dashboard/store/shipping/zones/new`}>
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Add Zone
					</Button>
				</Link>
			</div>

			<ZoneList zones={zones || []} locale={locale} onDelete={handleDelete} />
		</div>
	);
}
