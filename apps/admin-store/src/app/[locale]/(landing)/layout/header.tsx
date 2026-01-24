"use client";

import { Button } from "@workspace/ui/components/button";

import { GitHubIcon } from "@workspace/ui/components/icons/brands/github-icon";
import {
	LanguageSelector,
	type LocaleOption,
} from "@workspace/ui/components/language-selector";
import { ModeToggle } from "@workspace/ui/components/theme-toggle";
import { BookOpen, Menu, Palette, Sparkles, User, Zap } from "lucide-react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useModal } from "@/components/modals/modal-context";
import { LOCALES } from "@/constants/locales";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSession } from "@/lib/auth-client";

const navigation = [
	{ name: "Home", href: "/", icon: Zap },
	{ name: "Features", href: "/features", icon: Sparkles },
	{ name: "Themes", href: "/themes", icon: Palette },
	{ name: "Documentation", href: "/docs", icon: BookOpen },
];

const locales: LocaleOption[] = LOCALES.map(({ code, name }) => {
	const flagMap: Record<string, string> = {
		en: "🇺🇸",
		de: "🇩🇪",
		fr: "🇫🇷",
		ar: "🇸🇦",
	};
	return {
		code,
		label: name,
		flag: flagMap[code] || "",
		nativeName: name,
	};
});

export const HeaderMain = () => {
	const router = useRouter();
	const pathname = usePathname();
	const currentLocale = useLocale();
	const params = useParams();
	const { data: session } = useSession();
	const { openModal } = useModal();

	const handleLocaleChange = (locale: string) => {
		router.replace(
			// @ts-expect-error -- TypeScript will validate that only known `params`
			// are used in combination with a given `pathname`. Since the two will
			// always match for the current route, we can skip runtime checks.
			{ pathname, params },
			{ locale: locale },
		);
	};

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60">
			<div className="container mx-auto py-2 ps-4 sm:ps-6 lg:ps-8">
				<div className="flex h-16 items-center justify-between">
					{/* Logo */}
					<div className="flex items-center space-x-3">
						<div className="relative">
							<div className="-inset-1 absolute rounded-lg bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 opacity-75 blur" />
							<div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-background">
								<Zap className="h-6 w-6 text-primary" />
							</div>
						</div>
						<span className="bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text font-bold text-transparent text-xl">
							{"NextKit"}
						</span>
					</div>

					{/* Desktop Navigation */}
					<nav className="hidden items-center space-x-8 md:flex">
						{navigation.map((item) => {
							const Icon = item.icon;
							return (
								<a
									key={item.name}
									href={item.href}
									className="group flex items-center space-x-2 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
								>
									<Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
									<span>{item.name}</span>
								</a>
							);
						})}
					</nav>

					{/* Controls */}
					<div className="flex items-center space-x-2">
						{/* Language Selector */}
						<LanguageSelector
							locales={locales}
							currentLocale={currentLocale}
							onLocaleChange={handleLocaleChange}
							size="icon"
						/>
						{/* Theme Toggle */}
						<ModeToggle />
						{/* GitHub Link */}
						<Button variant="outline" size="icon">
							<a
								href="https://github.com"
								target="_blank"
								rel="noopener noreferrer"
								className=""
							>
								<GitHubIcon className="h-[1.2rem] w-[1.2rem]" />
							</a>
						</Button>

						{/* Profile Link / Sign In Button */}
						{session ? (
							<Button variant="outline" size="icon">
								<a href="/dashboard" className="">
									<User className="h-[1.2rem] w-[1.2rem]" />
								</a>
							</Button>
						) : (
							<Button
								variant="outline"
								size="icon"
								onClick={() => openModal("signIn", null)}
								className=""
							>
								<User className="h-[1.2rem] w-[1.2rem]" />
							</Button>
						)}
						{/* Mobile Menu Button */}
						<button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden">
							{/* {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : ( */}
							<Menu className="h-5 w-5" />
							{/* )} */}
						</button>
					</div>
				</div>
			</div>
		</header>
	);
};
