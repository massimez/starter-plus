"use client";

import { FeatureCard } from "@workspace/ui/components/cards/feature-card";
import {
	Bot,
	Code2,
	CreditCard,
	Database,
	Languages,
	Lock,
	Palette,
	ShieldCheck,
	Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function FeaturesSection() {
	const t = useTranslations("Features");
	const features = [
		{
			icon: Code2,
			title: t("features.nextGenStack.title"),
			description: t("features.nextGenStack.description"),
			gradient: "from-blue-500 to-cyan-500",
		},
		{
			icon: Lock,
			title: t("features.advancedAuth.title"),
			description: t("features.advancedAuth.description"),
			gradient: "from-purple-600 to-indigo-500",
		},
		{
			icon: CreditCard,
			title: t("features.builtInSubscriptions.title"),
			description: t("features.builtInSubscriptions.description"),
			gradient: "from-pink-500 to-red-500",
		},
		{
			icon: Wallet,
			title: t("features.web3Ready.title"),
			description: t("features.web3Ready.description"),
			gradient: "from-yellow-400 to-orange-500",
		},
		{
			icon: Bot,
			title: t("features.aiReadyDashboard.title"),
			description: t("features.aiReadyDashboard.description"),
			gradient: "from-yellow-400 to-orange-500",
		},
		{
			icon: Palette,
			title: t("features.beautifulUI.title"),
			description: t("features.beautifulUI.description"),
			gradient: "from-green-500 to-emerald-500",
		},
		{
			icon: Database,
			title: t("features.typeSafeBackend.title"),
			description: t("features.typeSafeBackend.description"),
			gradient: "from-sky-500 to-cyan-600",
		},
		{
			icon: Languages,
			title: t("features.i18nReady.title"),
			description: t("features.i18nReady.description"),
			gradient: "from-teal-500 to-lime-500",
		},
		{
			icon: ShieldCheck,
			title: t("features.productionGrade.title"),
			description: t("features.productionGrade.description"),
			gradient: "from-zinc-500 to-neutral-800",
		},
	];

	const [activeFeature, setActiveFeature] = useState(0);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <features.length>
	useEffect(() => {
		const interval = setInterval(() => {
			setActiveFeature((prev) => (prev + 1) % features.length);
		}, 3000);
		return () => clearInterval(interval);
	}, []);

	return (
		<section className="py-20">
			<div className="container mx-auto px-4">
				<div className="mx-auto mb-16 max-w-2xl text-center">
					<h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
						{t("heading")}
					</h2>
					<p className="mt-4 text-lg text-muted-foreground">
						{t("subheading")}
					</p>
				</div>

				<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
					{features.map((feature, index) => (
						<FeatureCard
							key={feature.title}
							icon={feature.icon}
							title={feature.title}
							description={feature.description}
							gradient={feature.gradient}
							isActive={index === activeFeature}
							onMouseEnter={() => setActiveFeature(index)}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
