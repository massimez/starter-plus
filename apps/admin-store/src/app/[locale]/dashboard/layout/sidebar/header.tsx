"use client";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { Separator } from "@workspace/ui/components/separator";
import { SidebarTrigger } from "@workspace/ui/components/sidebar";
import { Skeleton } from "@workspace/ui/components/skeleton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { UserNav } from "./user-nav";

interface BreadcrumbConfig {
	label?: string;
	hideFromBreadcrumb?: boolean;
	icon?: React.ReactNode;
}

// Enhanced route configuration
const routeConfig: Record<string, BreadcrumbConfig> = {
	dashboard: {
		label: "Dashboard",
		// icon: <HomeIcon className="h-4 w-4" />
	},
	users: {
		label: "User Management",
	},
	settings: {
		label: "Settings",
	},
	profile: {
		label: "Profile",
	},
	analytics: {
		label: "Analytics",
	},
	reports: {
		label: "Reports",
	},
	// Dynamic route examples
	"[id]": {
		label: "Details",
	},
	"[slug]": {
		label: "Item",
	},
	// Routes to hide from breadcrumb
	api: {
		hideFromBreadcrumb: true,
	},
};

// Function to format route segments into readable labels
const formatLabel = (
	segment: string,
	_index?: number,
	_allSegments?: string[],
): string => {
	const config = routeConfig[segment];

	// If explicitly configured, use that label
	if (config?.label) {
		return config.label;
	}

	// Handle dynamic routes
	if (segment.startsWith("[") && segment.endsWith("]")) {
		const paramName = segment.slice(1, -1);
		return routeConfig[segment]?.label || `${formatLabel(paramName)}`;
	}

	// Handle UUID-like strings (make them more readable)
	if (
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
			segment,
		)
	) {
		return "Details";
	}

	// Handle numeric IDs
	if (/^\d+$/.test(segment)) {
		return `Item ${segment}`;
	}

	// Convert kebab-case, snake_case, or camelCase to Title Case
	return segment
		.replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase
		.split(/[-_]/) // kebab-case and snake_case
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");
};

interface BreadcrumbItemData {
	href: string;
	label: string;
	isLast: boolean;
	icon?: React.ReactNode;
}

const BreadcrumbSkeleton = () => (
	<div className="flex items-center space-x-2">
		<Skeleton className="h-4 w-16" />
		<span className="text-muted-foreground">/</span>
		<Skeleton className="h-4 w-20" />
	</div>
);

const DynamicBreadcrumb = () => {
	const pathname = usePathname();

	// Split pathname and filter out empty segments
	const pathSegments = pathname.split("/").filter((segment) => segment !== "");

	// Find dashboard index and get segments from dashboard onwards
	const dashboardIndex = pathSegments.indexOf("dashboard");
	if (dashboardIndex === -1) return null;

	const relevantSegments = pathSegments.slice(dashboardIndex);

	// Filter out segments that should be hidden
	const visibleSegments = relevantSegments.filter(
		(segment) => !routeConfig[segment]?.hideFromBreadcrumb,
	);

	// Generate breadcrumb items
	const breadcrumbItems: BreadcrumbItemData[] = visibleSegments.map(
		(segment, index) => {
			// Calculate the actual path index for href generation
			const actualIndex = relevantSegments.findIndex((_s, i) => {
				const visibleCount = relevantSegments
					.slice(0, i + 1)
					.filter((seg) => !routeConfig[seg]?.hideFromBreadcrumb).length;
				return visibleCount === index + 1;
			});

			const href = `/${pathSegments.slice(0, dashboardIndex + actualIndex + 1).join("/")}`;
			const label = formatLabel(segment, index, visibleSegments);
			const isLast = index === visibleSegments.length - 1;
			const icon = routeConfig[segment]?.icon;

			return {
				href,
				label,
				isLast,
				icon,
			};
		},
	);

	// Don't render if only dashboard
	if (breadcrumbItems.length <= 1) {
		return null;
	}

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{breadcrumbItems.map((item, index) => (
					<div key={item.href} className="flex items-center">
						{index > 0 && (
							<div className="me-2">
								<BreadcrumbSeparator className="hidden md:block" />
							</div>
						)}
						<BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
							{item.isLast ? (
								<BreadcrumbPage className="flex items-center gap-1">
									{item.icon}
									{item.label}
								</BreadcrumbPage>
							) : (
								<BreadcrumbLink asChild>
									<Link href={item.href} className="flex items-center gap-1">
										{item.icon}
										{item.label}
									</Link>
								</BreadcrumbLink>
							)}
						</BreadcrumbItem>
					</div>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
};

export const HeaderDashboard = () => {
	return (
		<header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b pr-4">
			<div className="flex items-center gap-2 px-3">
				<SidebarTrigger />
				<Separator orientation="vertical" className="mr-2 h-4" />
				<Suspense fallback={<BreadcrumbSkeleton />}>
					<DynamicBreadcrumb />
				</Suspense>
			</div>
			<UserNav />
		</header>
	);
};
