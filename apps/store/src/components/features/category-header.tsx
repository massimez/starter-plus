"use client";

import { Badge } from "@workspace/ui/components/badge";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import {
	type Collection,
	getCollectionTranslation,
} from "@/lib/storefront-types";
import { cn } from "@/lib/utils";

interface CategoryHeaderProps {
	title: string;
	subcategories: Collection[];
	className?: string;
}

export function CategoryHeader({
	title,
	subcategories,
	className,
}: CategoryHeaderProps) {
	const locale = useLocale();

	return (
		<div className={cn("", className)}>
			<h1 className="pb-6 font-bold text-3xl md:text-4xl">{title}</h1>

			{subcategories.length > 0 && (
				<div className="mb-9 flex flex-wrap gap-2">
					{subcategories.map((sub) => {
						const translation = getCollectionTranslation(sub, locale);
						const name = translation?.name || sub.name;

						return (
							<Link key={sub.id} href={`/category/${sub.slug}`}>
								<Badge
									variant="outline"
									className="cursor-pointer rounded-xl px-4 py-4 text-sm transition-colors hover:bg-secondary/80"
								>
									{name}
								</Badge>
							</Link>
						);
					})}
				</div>
			)}
		</div>
	);
}
