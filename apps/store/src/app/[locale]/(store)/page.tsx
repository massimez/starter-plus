"use client";

import { CategoryGrid } from "@/components/features/category/category-grid";
import { PromoBanner } from "@/components/features/promo-banner";
import { useOrganization } from "@/lib/hooks/use-storefront";

export default function HomePage() {
	// Fetch data
	const { data: org, isLoading: isLoadingOrg } = useOrganization("yam");

	if (isLoadingOrg && !org) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-32 w-32 animate-spin rounded-full border-violet-500 border-t-2 border-b-2" />
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col gap-10">
			<PromoBanner className="-mx-4 -mt-4 rounded-2xl" />
			<CategoryGrid />
		</div>
	);
}
