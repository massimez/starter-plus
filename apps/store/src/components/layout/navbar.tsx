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
import { useState } from "react";
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
		{ code: "ar", label: "العربية", flag: "🇸🇦", nativeName: "العربية" },
	];

	const handleLocaleChange = (locale: string) => {
		router.replace(pathname, { locale });
	};

	// Get actual auth state from session
	const { data: session } = useSession();
	const isAuthenticated = !!session?.user;
	const user = {
		name: session?.user?.name || "User",
		email: session?.user?.email || "",
		avatar: session?.user?.image || "", // Optional avatar URL
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

	return (
		<header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
			<Card className="mx-auto flex h-20 flex-row items-center gap-4 px-4">
				{/* Logo Section */}
				<Link href="/" className="me-6 flex w-[236px] items-center gap-2">
					{logo ? (
						<div className="relative flex h-12 w-auto max-w-[200px] items-center justify-center">
							<Image
								src={logo}
								alt={storeName}
								width={0}
								height={0}
								sizes="200px"
								className="h-full w-auto object-contain"
							/>
							<span className="font-bold text-2xl text-[#774ba9] tracking-tight">
								{storeName}
							</span>
						</div>
					) : (
						<>
							<div className="flex items-center justify-center text-primary">
								<Tornado className="h-8 w-8 rotate-180" />
							</div>
							<span className="font-bold text-2xl text-primary tracking-tight">
								{storeName}
							</span>
						</>
					)}
				</Link>

				{/* Search Bar */}
				<div className="hidden w-full flex-1 items-center justify-center px-8 lg:flex">
					<div className="flex w-full max-w-2xl items-center rounded-md border border-input bg-muted/30 focus-within:ring-1 focus-within:ring-ring">
						<div className="relative flex-1">
							<Input
								placeholder="Search"
								className="h-10 rounded-none border-0 bg-transparent px-4 shadow-none focus-visible:ring-0"
							/>
						</div>

						<Button
							variant="ghost"
							size="icon"
							className="h-10 w-12 rounded-l-none hover:bg-transparent"
						>
							<Search className="h-5 w-5 text-muted-foreground" />
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
							className="hidden lg:flex"
							classNameIcon="size-6"
							onLoginClick={() => {
								setAuthModalView("signIn");
								setIsAuthModalOpen(true);
							}}
						/>
					</div>
					<LanguageSelector
						locales={locales}
						currentLocale={currentLocale}
						onLocaleChange={handleLocaleChange}
						triggerVariant="ghost"
						size="icon"
						iconClassName="size-6"
					/>
					<ModeToggle
						className="max-sm:hidden"
						variant="ghost"
						iconClassName="size-6"
					/>
					{isAuthenticated ? (
						<UserProfileDrawer user={user} onSignOut={handleSignOut}>
							<Button variant="ghost" className="gap-0 px-0">
								<Avatar className="size-8">
									<AvatarImage src={user.avatar} alt={user.name} />
									<AvatarFallback className="bg-background-transparent">
										<User className="size-7" />
									</AvatarFallback>
								</Avatar>
								<ChevronDown className="size-4" />
							</Button>
						</UserProfileDrawer>
					) : (
						<Button
							variant="ghost"
							className="gap-2 pr-0 text-foreground"
							onClick={() => {
								setAuthModalView("signIn");
								setIsAuthModalOpen(true);
							}}
						>
							<User className="size-7" />
							<ChevronDown className="size-4" />
						</Button>
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
