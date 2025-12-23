"use client";

import { useMounted } from "@workspace/ui/hooks/use-mounted";
import { OrderHistory } from "@/components/profile/order-history";
import { useSession } from "@/lib/auth-client";
import { useOrders, useOrganization } from "@/lib/hooks/use-storefront";

export default function OrdersPage() {
	const { data: session, isPending } = useSession();
	const isClient = useMounted();

	// Fetch organization
	const { data: org } = useOrganization("yam");
	const organizationId = org?.id;

	// Fetch orders
	const { data: orders, isLoading: isLoadingOrders } = useOrders(
		{
			organizationId: organizationId || "",
			userId: session?.user?.id || "",
		},
		!!session?.user?.id && !!organizationId,
	);

	if (isPending || !isClient) {
		return (
			<div className="flex h-[50vh] items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-primary border-t-2" />
			</div>
		);
	}

	if (!session) {
		return null;
	}

	return (
		<div className="container mx-auto space-y-8 px-4 pb-16 md:block">
			<OrderHistory orders={orders} isLoadingOrders={isLoadingOrders} />
		</div>
	);
}
