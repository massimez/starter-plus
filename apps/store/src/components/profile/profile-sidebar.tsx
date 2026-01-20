"use client";

import { Button } from "@workspace/ui/components/button";
import { MapPin, Settings, Shield, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

import { cn } from "@/lib/utils";

interface ProfileSidebarProps extends React.HTMLAttributes<HTMLElement> {
	activeTab: string;
	onTabChange: (tab: string) => void;
}

export function ProfileSidebar({
	className,
	activeTab,
	onTabChange,
	...props
}: ProfileSidebarProps) {
	const t = useTranslations("Profile.sidebar");
	const items = [
		{
			id: "settings",
			title: t("settings"),
			icon: Settings,
		},
		{
			id: "addresses",
			title: t("addresses"),
			icon: MapPin,
		},
		{
			id: "privacy",
			title: t("privacy"),
			icon: Shield,
		},
	];

	return (
		<div className="overflow-x-auto pb-2 lg:overflow-x-visible lg:pb-0">
			<nav
				className={cn(
					"flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
					className,
				)}
				{...props}
			>
				{items.map((item) => (
					<Button
						key={item.id}
						variant={activeTab === item.id ? "secondary" : "ghost"}
						className={cn(
							"w-full justify-start",
							activeTab === item.id && "bg-muted hover:bg-muted",
						)}
						onClick={() => onTabChange(item.id)}
					>
						<item.icon className="mr-2 h-4 w-4" />
						{item.title}
					</Button>
				))}
				<Button variant="ghost" className="w-full justify-start" asChild>
					<Link href="/orders">
						<ShoppingBag className="mr-2 h-4 w-4" />
						{t("orders")}
					</Link>
				</Button>
			</nav>
		</div>
	);
}
