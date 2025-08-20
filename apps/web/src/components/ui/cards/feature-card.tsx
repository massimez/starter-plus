import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface FeatureCardProps {
	icon: LucideIcon;
	title: string;
	description: string;
	gradient: string;
	isActive?: boolean;
	onMouseEnter?: () => void;
}

export function FeatureCard({
	icon: Icon,
	title,
	description,
	gradient,
	isActive = false,
	onMouseEnter,
}: FeatureCardProps) {
	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: <>
		<div
			className={cn(
				"group relative rounded-xl border bg-background p-6 transition-all duration-300 hover:shadow-lg",
				isActive && "shadow-lg ring-2 ring-primary/20",
			)}
			onMouseEnter={onMouseEnter}
		>
			<div
				className={cn(
					"inline-flex rounded-lg bg-gradient-to-r p-3",
					gradient,
					"mb-4",
				)}
			>
				<Icon className="h-6 w-6 text-white" />
			</div>

			<h3 className="mb-2 font-semibold text-xl">{title}</h3>
			<p className="text-muted-foreground">{description}</p>

			<div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-10" />
		</div>
	);
}
