"use client";

import {
	Carousel,
	CarouselContent,
	CarouselDots,
	CarouselItem,
} from "@workspace/ui/components/carousel";
import Autoplay from "embla-carousel-autoplay";
import {
	Car,
	Home,
	Laptop,
	Settings,
	Shirt,
	ShoppingBag,
	Smartphone,
	Utensils,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface CategoryItem {
	name: string;
	slug: string;
	icon: React.ReactNode;
}

const categories: CategoryItem[] = [
	{
		name: "Boutiques",
		slug: "boutiques",
		icon: <ShoppingBag className="h-8 w-8" />,
	},
	{
		name: "Téléphones & Accessoires",
		slug: "telephones-accessoires",
		icon: <Smartphone className="h-8 w-8" />,
	},
	{
		name: "Immobilier",
		slug: "immobilier",
		icon: <Home className="h-8 w-8" />,
	},
	{
		name: "Automobiles & Véhicules",
		slug: "automobiles-vehicules",
		icon: <Car className="h-8 w-8" />,
	},
	{
		name: "Pièces détachées",
		slug: "pieces-detachees",
		icon: <Settings className="h-8 w-8" />,
	},
	{
		name: "Informatique",
		slug: "informatique",
		icon: <Laptop className="h-8 w-8" />,
	},
	{
		name: "Électroménager & Électronique",
		slug: "electromenager-electronique",
		icon: <Utensils className="h-8 w-8" />,
	},
	{
		name: "Mode & Beauté",
		slug: "mode-beaute",
		icon: <Shirt className="h-8 w-8" />,
	},
];

export function HomeCategoryCarousel() {
	return (
		<section className="-mt-20 bg-background py-8">
			<div className="container mx-auto px-4">
				{/* <h2 className="mb-6 text-center font-bold text-xl md:text-2xl">
					Parcourir par catégorie
				</h2> */}
				<div className="mx-auto max-w-5xl">
					<Carousel
						opts={{
							align: "center",
							loop: true,
						}}
						plugins={[
							Autoplay({
								delay: 3000,
								stopOnInteraction: true,
								stopOnMouseEnter: true,
							}),
						]}
						className="w-full"
					>
						<CarouselContent className="-ml-2 md:-ml-4 p-8">
							{categories.map((category) => (
								<CarouselItem
									key={category.slug}
									className="basis-[100px] pl-2 md:basis-[140px] md:pl-4 lg:basis-[160px]"
								>
									<Link
										href={{
											pathname: "/products",
											query: { category: category.name },
										}}
									>
										<div className="group flex cursor-pointer flex-col items-center gap-3 transition-transform hover:scale-105">
											<div
												className={cn(
													"flex h-[80px] w-[80px] items-center justify-center rounded-full bg-linear-to-br from-primary/10 to-primary/5 transition-all group-hover:from-primary/20 group-hover:to-primary/10 group-hover:shadow-lg md:h-[90px] md:w-[90px]",
												)}
											>
												<div className="text-primary transition-colors group-hover:text-primary/80">
													{category.icon}
												</div>
											</div>
											<span className="line-clamp-2 text-center font-medium text-foreground text-xs leading-tight md:text-sm">
												{category.name}
											</span>
										</div>
									</Link>
								</CarouselItem>
							))}
						</CarouselContent>
						<CarouselDots className="mt-2" />
					</Carousel>
				</div>
			</div>
		</section>
	);
}
