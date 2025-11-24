"use client";

import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@workspace/ui/components/carousel";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Category {
	name: string;
	subcategories: string[];
}

interface CategoryCarouselProps {
	categories: Category[];
	selectedCategories: string[];
	onSelectCategory: (category: string) => void;
	className?: string;
}

export function CategoryCarousel({
	categories,
	selectedCategories,
	onSelectCategory,
	className,
}: CategoryCarouselProps) {
	const [activeCategory, setActiveCategory] = useState<Category | null>(null);

	// Reset active category if selected categories change externally and don't include current active
	useEffect(() => {
		if (
			activeCategory &&
			!selectedCategories.includes(activeCategory.name) &&
			!activeCategory.subcategories.some((sub) =>
				selectedCategories.includes(sub),
			)
		) {
			// Optional: decide if we want to close the subcategory view when deselected
			setActiveCategory(null);
		}
	}, [selectedCategories, activeCategory]);

	const handleCategoryClick = (category: Category) => {
		if (activeCategory?.name === category.name) {
			// If clicking the active category header, maybe deselect or do nothing?
			// For now, let's toggle selection of the main category
			onSelectCategory(category.name);
		} else {
			// Enter subcategory view
			setActiveCategory(category);
			// Also select it if not selected?
			if (!selectedCategories.includes(category.name)) {
				onSelectCategory(category.name);
			}
		}
	};

	return (
		<div className={cn("w-full py-0", className)}>
			<Carousel
				opts={{
					align: "start",
					dragFree: true,
					loop: true,
				}}
				className="w-full"
			>
				<CarouselContent className="-ml-2 md:-ml-4">
					{activeCategory ? (
						// Render Subcategories
						<>
							{/* Header for active category - Clickable to toggle selection */}
							<CarouselItem className="basis-auto pl-2 md:pl-4">
								<button
									type="button"
									onClick={() => onSelectCategory(activeCategory.name)}
									className={cn(
										"group relative flex h-[140px] w-[140px] flex-col items-center justify-center rounded-xl border-2 p-4 transition-colors hover:border-primary hover:bg-accent/50",
										selectedCategories.includes(activeCategory.name)
											? "border-primary bg-primary/5 text-primary"
											: "border-muted bg-card text-card-foreground",
									)}
								>
									<div
										className={cn(
											"mb-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-background",
											selectedCategories.includes(activeCategory.name) &&
												"bg-primary text-primary-foreground group-hover:bg-primary",
										)}
									>
										<span className="font-bold text-lg">
											{activeCategory.name.charAt(0)}
										</span>
									</div>
									<span className="text-center font-medium text-sm leading-tight">
										{activeCategory.name}
									</span>
									{selectedCategories.includes(activeCategory.name) && (
										<div className="absolute top-2 right-2 rounded-full bg-primary p-0.5 text-primary-foreground">
											<Check className="h-3 w-3" />
										</div>
									)}
								</button>
							</CarouselItem>
							{activeCategory.subcategories.map((sub) => {
								const isSelected = selectedCategories.includes(sub);
								return (
									<CarouselItem key={sub} className="basis-auto pl-2 md:pl-4">
										<button
											type="button"
											onClick={() => onSelectCategory(sub)}
											className={cn(
												"group relative flex h-[140px] w-[140px] flex-col items-center justify-center rounded-xl border-2 p-4 transition-colors hover:border-primary hover:bg-accent/50",
												isSelected
													? "border-primary bg-primary/5 text-primary"
													: "border-muted bg-card text-card-foreground",
											)}
										>
											<div
												className={cn(
													"mb-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-background",
													isSelected &&
														"bg-primary text-primary-foreground group-hover:bg-primary",
												)}
											>
												<span className="font-bold text-lg">
													{sub.charAt(0)}
												</span>
											</div>
											<span className="text-center font-medium text-sm leading-tight">
												{sub}
											</span>
											{isSelected && (
												<div className="absolute top-2 right-2 rounded-full bg-primary p-0.5 text-primary-foreground">
													<Check className="h-3 w-3" />
												</div>
											)}
										</button>
									</CarouselItem>
								);
							})}
						</>
					) : (
						// Render Main Categories
						categories.map((category) => {
							const isSelected = selectedCategories.includes(category.name);
							const hasActiveSub = category.subcategories.some((sub) =>
								selectedCategories.includes(sub),
							);
							const effectiveSelected = isSelected || hasActiveSub;

							return (
								<CarouselItem
									key={category.name}
									className="basis-auto pl-2 md:pl-4"
								>
									<button
										type="button"
										onClick={() => handleCategoryClick(category)}
										className={cn(
											"group relative flex h-[140px] w-[140px] flex-col items-center justify-center rounded-xl border-2 p-4 transition-colors hover:border-primary hover:bg-accent/50",
											effectiveSelected
												? "border-primary bg-primary/5 text-primary"
												: "border-muted bg-card text-card-foreground",
										)}
									>
										<div
											className={cn(
												"mb-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-background",
												effectiveSelected &&
													"bg-primary text-primary-foreground group-hover:bg-primary",
											)}
										>
											<span className="font-bold text-lg">
												{category.name.charAt(0)}
											</span>
										</div>
										<span className="text-center font-medium text-sm leading-tight">
											{category.name}
										</span>
										{effectiveSelected && (
											<div className="absolute top-2 right-2 rounded-full bg-primary p-0.5 text-primary-foreground">
												<Check className="h-3 w-3" />
											</div>
										)}
									</button>
								</CarouselItem>
							);
						})
					)}
				</CarouselContent>
				<div className="hidden md:block">
					<CarouselPrevious className="-left-4" />
					<CarouselNext className="-right-4" />
				</div>
			</Carousel>
		</div>
	);
}
