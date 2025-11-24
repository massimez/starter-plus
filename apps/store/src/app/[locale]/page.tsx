"use client";

import { useLocale, useTranslations } from "next-intl";
import { FeaturedProducts } from "@/components/features/featured-products";
import { HomeCategoryCarousel } from "@/components/features/home-category-carousel";
import { PromoBanner } from "@/components/features/promo-banner";
import { WhyShopWithUs } from "@/components/features/why-shop-with-us";
import {
	useCollections,
	useOrganization,
	useProducts,
} from "@/lib/hooks/use-storefront";

export default function HomePage() {
	const locale = useLocale();
	const t = useTranslations("HomePage");

	// Fetch data
	const { data: org, isLoading: isLoadingOrg } = useOrganization("yam");
	const organizationId = org?.id || "qGH0Uy2lnzoOfVeU6kcaLSuqfdKon8qe";

	const { data: products = [] } = useProducts(
		{
			organizationId,
			limit: 8,
			sort: "newest",
		},
		!!organizationId,
	);

	const { data: collections = [] } = useCollections(
		organizationId,
		!!organizationId,
	);

	// Map products to match component interface
	const mappedProducts = products.map((p) => {
		const translation =
			p.translations?.find((t) => t.languageCode === locale) ||
			p.translations?.find((t) => t.languageCode === "en");

		return {
			id: p.id,
			name: translation?.name || "",
			price: p.minPrice || 0,
			category: "General", // TODO: Get category
			description: translation?.description || translation?.name || "",
			image: p.thumbnailImage?.url,
			rating: 4.5, // Placeholder
			reviews: 0,
			isNew:
				new Date(p.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000,
		};
	});

	if (isLoadingOrg && !org) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-32 w-32 animate-spin rounded-full border-violet-500 border-t-2 border-b-2" />
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col">
			{/* Hero Section */}
			<section className="relative overflow-hidden py-24 text-center md:py-32">
				{/* Animated Gradient Background */}
				<div className="absolute inset-0 bg-linear-to-br from-violet-500/20 via-fuchsia-500/20 to-pink-500/20 dark:from-violet-600/30 dark:via-fuchsia-600/30 dark:to-pink-600/30" />

				{/* Animated Orbs */}
				<div className="absolute top-1/4 left-1/4 h-64 w-64 animate-pulse rounded-full bg-linear-to-r from-violet-400 to-fuchsia-400 opacity-20 blur-3xl" />
				<div
					className="absolute right-1/4 bottom-1/4 h-80 w-80 animate-pulse rounded-full bg-linear-to-r from-pink-400 to-rose-400 opacity-20 blur-3xl"
					style={{ animationDelay: "2s" }}
				/>
				<div
					className="absolute top-1/3 left-1/3 h-72 w-72 animate-pulse rounded-full bg-linear-to-r from-blue-400 to-cyan-400 opacity-15 blur-3xl"
					style={{ animationDelay: "4s" }}
				/>

				{/* Content */}
				<div className="container relative z-10 mx-auto px-4">
					<div className="mx-auto max-w-4xl">
						<h1 className="mb-6 bg-linear-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text py-2 font-bold text-5xl text-transparent md:text-7xl dark:from-violet-400 dark:via-fuchsia-400 dark:to-pink-400">
							{t("title")}
						</h1>
						<p className="mb-10 text-lg text-muted-foreground md:text-2xl">
							{t("subtitle")}
						</p>
					</div>
				</div>

				{/* Bottom Gradient Fade */}
				<div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background to-transparent" />
			</section>

			<HomeCategoryCarousel collections={collections} />
			<FeaturedProducts products={mappedProducts} />
			<WhyShopWithUs />
			<PromoBanner />
		</div>
	);
}
