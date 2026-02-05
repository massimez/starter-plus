"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import {
	LanguageSelector,
	type LocaleOption,
} from "@workspace/ui/components/language-selector";
import { ModeToggle } from "@workspace/ui/components/theme-toggle";
import { ChevronDown, Search, Tornado, User } from "lucide-react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { type ComponentProps, useState } from "react";
import { toast } from "sonner";
import { CartButton } from "@/components/features/cart/cart-button";
import { UserProfileDrawer } from "@/components/features/profile/user-profile-drawer";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { signOut, useSession } from "@/lib/auth-client";
import { AuthModal } from "../auth/auth-modal";

interface NavbarProps {
	logo?: string | null;
	storeName?: string;
}

export function Navbar({ logo, storeName = "" }: NavbarProps) {
	const pathname = usePathname();
	const router = useRouter();
	const currentLocale = useLocale();
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const [authModalView, setAuthModalView] = useState<"signIn" | "signUp">(
		"signIn",
	);

	const locales: LocaleOption[] = [
		{ code: "en", label: "English", flag: "🇺🇸", nativeName: "English" },
		{ code: "fr", label: "Français", flag: "🇫🇷", nativeName: "Français" },
		{ code: "ar", label: "العربية", flag: "🇩🇿", nativeName: "العربية" },
	];

	const handleLocaleChange = (locale: string) => {
		router.replace(pathname, { locale });
	};

	const { data: session } = useSession();
	const isAuthenticated = !!session?.user;
	const user = {
		name: session?.user?.name || "User",
		email: session?.user?.email || "",
		avatar: session?.user?.image || "",
	};

	const handleSignOut = async () => {
		await signOut({
			fetchOptions: {
				onSuccess: () => {
					toast.success("Logged out successfully");
					router.push("/");
					router.refresh();
				},
				onError: (ctx) => {
					toast.error(ctx.error.message || "Failed to logout");
				},
			},
		});
	};
	const renderUserTriggerButton = (
		props: ComponentProps<typeof Button> = {},
	) => (
		<Button
			variant="ghost"
			className="gap-1 px-0 transition-all duration-200 hover:scale-105"
			{...props}
		>
			<Avatar className="size-8 transition-all duration-300 hover:ring-2 hover:ring-primary hover:ring-offset-2">
				{isAuthenticated ? (
					<AvatarImage src={user.avatar} alt={user.name} />
				) : null}
				<AvatarFallback className="bg-transparent">
					<User className="size-7 transition-transform duration-200 group-hover:scale-110" />
				</AvatarFallback>
			</Avatar>
			<ChevronDown className="size-4 transition-transform duration-200 group-hover:translate-y-0.5" />
		</Button>
	);

	return (
		<header className="fade-in slide-in-from-top-4 sticky top-0 z-50 w-full animate-in bg-background/95 backdrop-blur duration-500 supports-backdrop-filter:bg-background/60">
			<Card className="mx-auto flex h-20 flex-row items-center gap-4 px-4 transition-shadow duration-300 hover:shadow-md">
				{/* Logo Section */}
				<Link
					href="/"
					className="group me-6 flex w-[236px] items-center gap-2 transition-all duration-300 hover:scale-105"
				>
					{logo ? (
						<div className="relative flex h-12 w-auto max-w-[200px] items-center justify-center">
							<Image
								src={logo}
								alt={storeName}
								width={200}
								height={48}
								sizes="200px"
								className="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
							/>
							<span className="font-bold text-2xl text-[#774ba9] tracking-tight transition-all duration-300 group-hover:text-[#8b5ac0]">
								{storeName}
							</span>
						</div>
					) : (
						<>
							<div className="flex items-center justify-center text-primary">
								<Tornado className="h-8 w-8 rotate-180 transition-all duration-500 group-hover:rotate-270 group-hover:scale-110" />
							</div>
							<span className="font-bold text-2xl text-primary tracking-tight transition-all duration-300 group-hover:tracking-wide">
								{storeName}
							</span>
						</>
					)}
				</Link>

				{/* Search Bar */}
				<div className="hidden w-full md:flex" />
				<div className="hidden w-full flex-1 items-center justify-center px-8">
					<div className="flex w-full max-w-2xl items-center rounded-md border border-input bg-muted/30 transition-all duration-300 focus-within:scale-[1.02] focus-within:shadow-sm focus-within:ring-1 focus-within:ring-ring">
						<div className="relative flex-1">
							<Input
								placeholder="Search"
								className="h-10 rounded-none border-0 bg-transparent px-4 shadow-none transition-all duration-200 focus-visible:ring-0"
							/>
						</div>

						<Button
							variant="ghost"
							size="icon"
							className="group h-10 w-12 rounded-l-none transition-all duration-200 hover:scale-110 hover:bg-transparent"
						>
							<Search className="h-5 w-5 text-muted-foreground transition-all duration-200 group-hover:scale-110 group-hover:text-foreground" />
						</Button>
					</div>
				</div>

				{/* Right Actions */}
				<div className="flex w-[330px] flex-1 items-center justify-end gap-2 sm:gap-4 lg:flex-none">
					{/* <Button variant="ghost" size="icon" className="text-foreground">
						<Heart className="size-6 stroke-[1.5]" />
					</Button> */}

					<div className="flex items-center">
						<CartButton
							className="hidden transition-all duration-200 hover:scale-110 lg:flex"
							classNameIcon="size-6"
							onLoginClick={() => {
								setAuthModalView("signIn");
								setIsAuthModalOpen(true);
							}}
						/>
					</div>
					<div className="transition-all duration-200 hover:scale-110">
						<LanguageSelector
							locales={locales}
							currentLocale={currentLocale}
							onLocaleChange={handleLocaleChange}
							triggerVariant="ghost"
							size="icon"
							iconClassName="size-6"
						/>
					</div>
					<div className="transition-all duration-200 hover:scale-110">
						<ModeToggle
							className="max-sm:hidden"
							variant="ghost"
							iconClassName="size-6"
						/>
					</div>
					{isAuthenticated ? (
						<UserProfileDrawer user={user} onSignOut={handleSignOut}>
							{renderUserTriggerButton()}
						</UserProfileDrawer>
					) : (
						renderUserTriggerButton({
							onClick: () => {
								setAuthModalView("signIn");
								setIsAuthModalOpen(true);
							},
						})
					)}
				</div>
			</Card>
			<AuthModal
				open={isAuthModalOpen}
				onOpenChange={setIsAuthModalOpen}
				defaultView={authModalView}
			/>
		</header>
	);
}
