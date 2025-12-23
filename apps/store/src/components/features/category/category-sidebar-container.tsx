"use client";

import { CategorySidebar } from "@/app/[locale]/(store)/category/_components/category-sidebar";
import { usePathname } from "@/i18n/routing";
import { useCollections } from "@/lib/hooks/use-storefront";
import { cn } from "@/lib/utils";

export function CategorySidebarContainer({
	className,
}: {
	className?: string;
}) {
	const organizationId = process.env.NEXT_PUBLIC_ORGANIZATION_ID || "";
	const { data: collections = [] } = useCollections(
		organizationId,
		!!organizationId,
	);
	const pathname = usePathname();

	// Extract slug from pathname if present, e.g. /category/slug
	// This is a simple approximation. For robustness, we might strictly parse.
	const slug = pathname.split("/category/")[1] ?? "";

	if (collections.length === 0) return null;

	return (
		<div className={cn(className)}>
			<CategorySidebar collections={collections} activeSlug={slug} />
		</div>
	);
}
