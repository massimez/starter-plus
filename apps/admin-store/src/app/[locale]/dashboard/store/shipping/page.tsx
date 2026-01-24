"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Plus } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { PageDashboardHeader } from "@/app/[locale]/(landing)/_components/sections/page-dashboard-header";
import { hc } from "@/lib/api-client";
import { ShippingList } from "./_components/shipping-list";
import { useShippingMethods } from "./_components/use-shipping";

export default function ShippingPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = use(params);
	const queryClient = useQueryClient();
	const { data: shippingMethods, isLoading } = useShippingMethods();

	const handleDelete = async (id: string) => {
		await hc.api.store["shipping-methods"][":id"].$delete({
			param: { id },
		});
		queryClient.invalidateQueries({ queryKey: ["shipping-methods"] });
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8">Loading...</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<Card>
				<CardContent className="flex items-center justify-between">
					<PageDashboardHeader
						title="Shipping Methods"
						description="Manage your shipping methods and delivery options."
					/>
					<div className="flex gap-2">
						<Link href={`/${locale}/dashboard/store/shipping/zones`}>
							<Button variant="outline">Manage Zones</Button>
						</Link>
						<Link href={`/${locale}/dashboard/store/shipping/new`}>
							<Button>
								<Plus className="mr-2 h-4 w-4" />
								Add Method
							</Button>
						</Link>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent>
					<ShippingList
						shippingMethods={shippingMethods || []}
						locale={locale}
						onDelete={handleDelete}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
