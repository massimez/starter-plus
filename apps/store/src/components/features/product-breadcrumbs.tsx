"use client";

import { ChevronRight, Home } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface ProductBreadcrumbsProps {
	items: {
		label: string;
		href?: string;
	}[];
	className?: string;
}

export function ProductBreadcrumbs({
	items,
	className,
}: ProductBreadcrumbsProps) {
	const t = useTranslations("Navigation");

	return (
		<nav
			aria-label="Breadcrumb"
			className={cn(
				"flex items-center text-muted-foreground text-sm",
				className,
			)}
		>
			<ol className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
				<li className="inline-flex items-center gap-1.5">
					<Link
						href="/"
						className="flex items-center gap-2 transition-colors hover:text-foreground"
					>
						<Home className="h-4 w-4" />
						<span className="hidden sm:inline">{t("home")}</span>
					</Link>
				</li>
				{items.map((item, index) => {
					const isLast = index === items.length - 1;

					return (
						<li
							key={item.label}
							className="inline-flex items-center gap-1.5 sm:gap-2.5"
						>
							<ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
							{item.href && !isLast ? (
								<Link
									href={item.href}
									className="inline-block max-w-[20ch] truncate align-middle transition-colors hover:text-foreground sm:max-w-none"
								>
									{item.label}
								</Link>
							) : (
								<span
									className="inline-block max-w-[20ch] truncate align-middle font-medium text-foreground sm:max-w-none"
									aria-current="page"
								>
									{item.label}
								</span>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
