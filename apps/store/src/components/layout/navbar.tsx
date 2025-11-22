"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
	LanguageSelector,
	type LocaleOption,
} from "@workspace/ui/components/language-selector";
import { ModeToggle } from "@workspace/ui/components/theme-toggle";
import { LogIn, LogOut, Settings, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { CartButton } from "@/components/features/cart/cart-button";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { AuthModal } from "../auth/auth-modal";

export function Navbar() {
	const t = useTranslations("Navigation");
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

	const links = [
		{ href: "/", label: t("home") },
		{ href: "/products", label: t("products") },
		{ href: "/categories/all", label: t("categories") },
	];

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
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
			<div className="container mx-auto flex h-14 items-center px-2">
				<div className="me-4 hidden md:flex">
					<Link href="/" className="me-6 flex items-center space-x-2">
						<span className="hidden font-bold sm:inline-block">STORE</span>
					</Link>
					<nav className="flex items-center space-x-6 font-medium text-sm">
						{links.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className={cn(
									"transition-colors hover:text-foreground/80",
									pathname === link.href
										? "text-foreground"
										: "text-foreground/60",
								)}
							>
								{link.label}
							</Link>
						))}
					</nav>
				</div>
				<div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
					<div className="w-full flex-1 md:w-auto md:flex-none">
						{/* Search component would go here */}
					</div>
					<nav className="flex items-center gap-2">
						<LanguageSelector
							locales={locales}
							currentLocale={currentLocale}
							onLocaleChange={handleLocaleChange}
							size="icon"
						/>
						{isAuthenticated ? (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="icon">
										<Avatar className="h-[1.2rem] w-[1.2rem]">
											<AvatarImage src={user.avatar} alt={user.name} />
											<AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white text-xs">
												{user.name.charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-56" align="end" forceMount>
									<DropdownMenuLabel className="font-normal">
										<div className="flex flex-col space-y-1">
											<p className="font-medium text-sm leading-none">
												{user.name}
											</p>
											<p className="text-muted-foreground text-xs leading-none">
												{user.email}
											</p>
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={() => router.push("/profile")}>
										<User className="ms-2 h-4 w-4" />
										<span>Profile</span>
									</DropdownMenuItem>
									<DropdownMenuItem>
										<Settings className="ms-2 h-4 w-4" />
										<span>Settings</span>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={handleSignOut}
										variant="destructive"
									>
										<LogOut className="mr-2 h-4 w-4" />
										<span>Sign Out</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						) : (
							<Button
								variant="outline"
								size="icon"
								onClick={() => {
									setAuthModalView("signIn");
									setIsAuthModalOpen(true);
								}}
							>
								<LogIn className="h-[1.2rem] w-[1.2rem]" />
							</Button>
						)}
						<CartButton />
						<ModeToggle />
					</nav>
				</div>
			</div>
			<AuthModal
				open={isAuthModalOpen}
				onOpenChange={setIsAuthModalOpen}
				defaultView={authModalView}
			/>
		</header>
	);
}
