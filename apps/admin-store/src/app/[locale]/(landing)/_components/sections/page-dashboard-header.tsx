import type { ReactNode } from "react";

interface PageDashboardHeaderProps {
	title: string;
	description?: string;
	children?: ReactNode;
}

export function PageDashboardHeader({
	title,
	description,
	children,
}: PageDashboardHeaderProps) {
	return (
		<div className="mb-6">
			<h2 className="font-semibold text-xl">{title}</h2>
			{description && (
				<p className="mt-1 text-muted-foreground text-sm">{description}</p>
			)}
			{children}
		</div>
	);
}
