import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@workspace/ui/components/carousel";
import { Link } from "@/i18n/routing";

const categories = [
	{ name: "Electronics", slug: "electronics" },
	{ name: "Clothing", slug: "clothing" },
	{ name: "Home & Garden", slug: "home-garden" },
	{ name: "Sports", slug: "sports" },
	{ name: "Toys", slug: "toys" },
	{ name: "Books", slug: "books" },
];

export function CategoryGrid() {
	return (
		<section className="py-12">
			<div className="container mx-auto px-4">
				<h2 className="mb-8 text-center font-bold text-xl md:text-3xl">
					Shop by Category
				</h2>
				<Carousel
					opts={{
						align: "start",
						loop: true,
					}}
					className="mx-auto w-full max-w-5xl"
				>
					<CarouselContent>
						{categories.map((category) => (
							<CarouselItem
								key={category.slug}
								className="md:basis-1/2 lg:basis-1/4"
							>
								<div className="p-1">
									<Link
										href={{
											pathname: "/products",
											query: { category: category.name },
										}}
									>
										<Card className="h-full cursor-pointer transition-shadow hover:shadow-lg">
											<CardHeader>
												<CardTitle className="text-center">
													{category.name}
												</CardTitle>
											</CardHeader>
											<CardContent className="flex h-32 items-center justify-center bg-muted/20">
												<span className="text-4xl">📦</span>
											</CardContent>
										</Card>
									</Link>
								</div>
							</CarouselItem>
						))}
					</CarouselContent>
					<CarouselPrevious />
					<CarouselNext />
				</Carousel>
			</div>
		</section>
	);
}
