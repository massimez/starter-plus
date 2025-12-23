"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { cn } from "@workspace/ui/lib/utils";
import { Sparkles, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import type { Collection } from "./utils";

interface CategorySidebarProps {
	collections: Collection[];
	activeSlug: string;
}

export function CategorySidebar({
	collections,
	activeSlug,
}: CategorySidebarProps) {
	const [expandedItems, setExpandedItems] = useState<string[]>([]);

	// Mock static items based on the image provided
	const _staticItems = [
		{
			name: "Collected for you",
			icon: <Sparkles className="h-5 w-5 text-orange-500" />,
			slug: "collected-for-you",
		},
		{
			name: "Ready Food",
			icon: <UtensilsCrossed className="h-5 w-5 text-green-600" />,
			slug: "ready-food",
		},
	];

	// Auto-expand the category containing the active slug
	useEffect(() => {
		const itemsToExpand = collections
			.filter(
				(c) =>
					c.slug === activeSlug ||
					c.children?.some((child) => child.slug === activeSlug),
			)
			.map((c) => c.id);

		if (itemsToExpand.length > 0) {
			setExpandedItems((prev) => {
				const uniqueItems = new Set([...prev, ...itemsToExpand]);
				return Array.from(uniqueItems);
			});
		}
	}, [activeSlug, collections]);

	return (
		<aside className="w-full">
			{/* Static Section */}
			{/* <div className="space-y-1">
				{staticItems.map((item) => (
					<Link
						key={item.slug}
						href={`/category/${item.slug}`}
						className={cn(
							"flex items-center gap-3 rounded-xl px-3 py-2 font-medium text-sm transition-colors hover:bg-accent/50",
							activeSlug === item.slug
								? "bg-accent text-accent-foreground"
								: "text-muted-foreground",
						)}
					>
						<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background shadow-sm">
							{item.icon}
						</div>
						<span>{item.name}</span>
					</Link>
				))}
			</div>

			<div className="my-4 px-3">
				<Separator />
			</div> */}

			<Accordion
				type="multiple"
				className="w-full space-y-1"
				value={expandedItems}
				onValueChange={setExpandedItems}
			>
				{collections.map((collection) => {
					const isActive = activeSlug === collection.slug;
					const hasChildren =
						collection.children && collection.children.length > 0;

					if (hasChildren) {
						return (
							<AccordionItem
								key={collection.id}
								value={collection.id}
								className="border-none"
							>
								<AccordionTrigger
									className={cn(
										"items-center rounded-xl px-1 py-2 font-medium text-muted-foreground text-sm hover:bg-accent/50 hover:no-underline data-[state=open]:text-foreground [&>svg]:translate-y-0",
										(isActive ||
											collection.children?.some(
												(child) => child.slug === activeSlug,
											)) &&
											"text-foreground",
									)}
								>
									<div className="flex items-center gap-2">
										<div className="0 relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background shadow-sm">
											{collection.image ? (
												<Image
													src={collection.image}
													alt={collection.name}
													fill
													className="object-cover"
												/>
											) : (
												<span className="text-muted-foreground text-xs" />
											)}
										</div>
										<span className="font-semibold">{collection.name}</span>
									</div>
								</AccordionTrigger>
								<AccordionContent className="space-y-1 ps-11 pe-2 pb-0">
									<Link
										href={`/category/${collection.slug}`}
										className={cn(
											"block w-full rounded-lg px-3 py-1.5 font-medium text-sm transition-colors hover:bg-accent/30 hover:text-foreground",
											isActive
												? "bg-accent/30 font-semibold text-foreground"
												: "text-muted-foreground",
										)}
									>
										All {collection.name}
									</Link>
									{collection.children?.map((child) => (
										<Link
											key={child.id}
											href={`/category/${child.slug}`}
											className={cn(
												"block w-full rounded-lg px-3 py-1.5 font-medium text-sm transition-colors hover:bg-accent/30 hover:text-foreground",
												activeSlug === child.slug
													? "bg-accent/30 font-semibold text-foreground"
													: "text-muted-foreground",
											)}
										>
											{child.name}
										</Link>
									))}
								</AccordionContent>
							</AccordionItem>
						);
					}

					return (
						<Link
							key={collection.id}
							href={`/category/${collection.slug}`}
							className={cn(
								"flex items-center gap-3 rounded-xl px-3 py-2 font-medium text-sm transition-colors hover:bg-accent/50",
								isActive
									? "bg-accent text-accent-foreground"
									: "text-muted-foreground",
							)}
						>
							<div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-background shadow-sm">
								{collection.image ? (
									<Image
										src={collection.image}
										alt={collection.name}
										fill
										className="object-cover"
									/>
								) : (
									<span className="text-muted-foreground text-xs" />
								)}
							</div>
							<span>{collection.name}</span>
						</Link>
					);
				})}
			</Accordion>
		</aside>
	);
}
