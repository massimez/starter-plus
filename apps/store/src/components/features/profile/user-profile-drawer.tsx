"use client";

import { Button } from "@workspace/ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@workspace/ui/components/sheet";
import { Gift, LogOut, MapPin, Settings, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";

interface UserProfileDrawerProps {
	user: {
		name: string;
		email: string;
		avatar?: string;
	};
	onSignOut: () => void;
	children: React.ReactNode;
}

export function UserProfileDrawer({
	user,
	onSignOut,
	children,
}: UserProfileDrawerProps) {
	const t = useTranslations("Navigation");
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);

	const menuItems = [
		{
			label: t("drawer.orders"),
			icon: ShoppingBag,
			href: "/orders",
		},
		{
			label: t("drawer.addresses"),
			icon: MapPin,
			href: "/profile?tab=address",
		},
		{
			label: t("drawer.settings"),
			icon: Settings,
			href: "/profile?tab=settings",
		},
		{
			label: t("drawer.rewards"),
			icon: Gift,
			href: "/rewards",
			badge: "1", // Assuming 'p' for points or similar from image
			badgeColor: "bg-lime-400 text-black",
		},
	];

	// Helper to close drawer on navigation
	const handleNavigation = (href: string) => {
		setIsOpen(false);
		router.push(href);
	};

	return (
		<Sheet open={isOpen} onOpenChange={setIsOpen}>
			<SheetTrigger asChild>{children}</SheetTrigger>
			<SheetContent className="flex w-full flex-col sm:max-w-md">
				<SheetHeader className="text-left">
					<SheetTitle className="sr-only">{t("profile")}</SheetTitle>
					<div className="flex flex-col">
						<div className="font-bold">{user.name}</div>
						<div className="text-muted-foreground text-sm">{user.email}</div>
					</div>
				</SheetHeader>

				<div className="flex-1 overflow-y-auto">
					<div className="flex flex-col space-y-1">
						{menuItems.map((item, index) => (
							<div key={item.label}>
								{index > 0 && <div className="my-2 h-px bg-border/40" />}
								<Button
									variant="ghost"
									className="group flex h-14 w-full items-center justify-between px-2 font-normal"
									onClick={() => handleNavigation(item.href)}
								>
									<div className="flex items-center gap-4">
										<item.icon className="size-7 stroke-1" />
										<span className="font-medium text-lg">{item.label}</span>
									</div>
									{item.badge && (
										<span
											className={`rounded-full px-2 py-0.5 font-bold text-xs ${item.badgeColor || "bg-primary text-primary-foreground"}`}
										>
											{item.badge}
										</span>
									)}
								</Button>
							</div>
						))}
					</div>
				</div>

				<div className="mt-auto mb-1 flex flex-col gap-3 py-4">
					<Button
						variant="secondary"
						size="lg"
						className="w-full justify-center rounded-full bg-secondary/50 font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
						onClick={() => {
							setIsOpen(false);
							onSignOut();
						}}
					>
						<LogOut className="size-6" />
						{t("logout")}
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	);
}
