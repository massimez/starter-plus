"use client";

import { useMounted } from "@workspace/ui/hooks/use-mounted";
import { useLocale } from "next-intl";
import { use } from "react";
import { CategoryHeader } from "@/components/features/category-header";
import { ProductBreadcrumbs } from "@/components/features/product-breadcrumbs";
import { SubcategoryRow } from "@/components/features/subcategory-row";
import { useCollections } from "@/lib/hooks/use-storefront";
import { getCollectionTranslation } from "@/lib/storefront-types";
import { LeafCategoryGrid } from "../_components/leaf-category-grid";
import { type Collection, getCollectionPath } from "../_components/utils";

interface PageProps {
	params: Promise<{
		slug: string;
		locale: string;
	}>;
}

export default function CategoryPage({ params }: PageProps) {
	const resolvedParams = use(params);
	const { slug } = resolvedParams;
	const locale = useLocale();
	const mounted = useMounted();

	// Fetch all collections to find the current one and its tree
	const { data: collections = [], isLoading } = useCollections(true);

	const collectionPath = getCollectionPath(collections, slug);
	const collection = collectionPath
		? collectionPath[collectionPath.length - 1]
		: null;

	const hasSubcategories =
		collection?.children && collection.children.length > 0;

	// Breadcrumbs with translations
	const breadcrumbs = (collectionPath || []).map((c, index) => {
		const translation = getCollectionTranslation(c, locale);
		const name = translation?.name || c.name;

		return {
			label: name,
			href:
				collectionPath && index < collectionPath.length - 1
					? `/category/${c.slug}`
					: undefined,
		};
	});

	const renderContent = () => {
		// Don't show loading state until mounted to prevent hydration mismatch
		if (!mounted || isLoading) {
			return (
				<div className="flex h-96 items-center justify-center">
					{mounted && isLoading && (
						<div className="h-32 w-32 animate-spin rounded-full border-violet-500 border-t-2 border-b-2" />
					)}
				</div>
			);
		}

		if (!collection) {
			return (
				<div className="py-20 text-center">
					<h1 className="font-bold text-2xl">Category not found</h1>
				</div>
			);
		}

		// Get translated name for the current collection
		const collectionTranslation = getCollectionTranslation(collection, locale);
		const collectionName = collectionTranslation?.name || collection.name;

		// If it has subcategories, show the "Grouped View"
		if (hasSubcategories && collection.children) {
			return (
				<div className="space-y-3">
					<ProductBreadcrumbs items={breadcrumbs} />

					<CategoryHeader
						title={collectionName}
						subcategories={collection.children}
					/>

					<div className="space-y-2">
						{collection.children.map((child: Collection, _index: number) => {
							const childTranslation = getCollectionTranslation(child, locale);
							const childName = childTranslation?.name || child.name;

							return (
								<div key={child.id}>
									<SubcategoryRow
										collectionId={child.id}
										title={childName}
										slug={child.slug}
										className="mt-4 mb-8"
									/>
								</div>
							);
						})}
					</div>
				</div>
			);
		}

		// Leaf category view
		return (
			<div className="space-y-8">
				<ProductBreadcrumbs items={breadcrumbs} />
				<div className="space-y-6">
					<h1 className="font-bold text-3xl md:text-4xl">{collectionName}</h1>
					<LeafCategoryGrid collectionId={collection.id} />
				</div>
			</div>
		);
	};
	return <div className="">{renderContent()}</div>;
}
