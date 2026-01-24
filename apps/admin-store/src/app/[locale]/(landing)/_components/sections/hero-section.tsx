"use client";

import { ArrowRight, Download, Github, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

export function HeroSection() {
	const t = useTranslations("Hero");
	const stats = [
		{ label: t("stats.downloads"), value: t("stats.downloadsValue") },
		{ label: t("stats.stars"), value: t("stats.starsValue") },
		{ label: t("stats.contributors"), value: t("stats.contributorsValue") },
		{
			label: t("stats.happyDevelopers"),
			value: t("stats.happyDevelopersValue"),
		},
	];

	return (
		<section className="relative py-20 lg:py-32">
			<div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20" />
			<div className="absolute inset-0 bg-grid-pattern opacity-5" />

			<div className="container relative mx-auto px-4 text-center">
				<div className="mx-auto max-w-4xl">
					{/* Badge */}
					<div className="mb-8 inline-flex items-center rounded-full border bg-background/50 px-4 py-2 text-sm backdrop-blur-sm">
						<Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
						<span className="font-medium">{t("badge")}</span>
						<div className="ms-2 rounded-full bg-green-500 px-2 py-1 text-white text-xs">
							{t("badgeNew")}
						</div>
					</div>

					{/* Main Heading */}
					<h1 className="mb-6 font-bold text-4xl tracking-tight sm:text-6xl lg:text-7xl">
						<span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
							{t("title")}
						</span>
						<br />
						<span className="text-foreground">{t("subtitle")}</span>
					</h1>

					<p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
						{t("description")}
					</p>

					{/* CTA Buttons */}
					<div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
						<button className="group relative inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 font-medium text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl">
							<Download className="h-5 w-5" />
							{t("cta.getStarted")}
							<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
						</button>

						<button className="group inline-flex items-center gap-2 rounded-lg border bg-background/50 px-8 py-3 font-medium backdrop-blur-sm transition-all hover:bg-background">
							<Github className="h-5 w-5" />
							{t("cta.github")}
						</button>
					</div>

					{/* Stats */}
					<div className="mt-16">
						<Stats stats={stats} />
					</div>
				</div>
			</div>
		</section>
	);
}

interface Stat {
	label: string;
	value: string;
}

interface StatsProps {
	stats: Stat[];
}

function Stats({ stats }: StatsProps) {
	return (
		<div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
			{stats.map((stat) => (
				<div key={stat.label} className="text-center">
					<div className="font-bold text-2xl text-foreground sm:text-3xl">
						{stat.value}
					</div>
					<div className="text-muted-foreground text-sm">{stat.label}</div>
				</div>
			))}
		</div>
	);
}
