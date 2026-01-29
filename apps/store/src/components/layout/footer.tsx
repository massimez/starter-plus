"use client";

import { Button } from "@workspace/ui/components/button";
import { FacebookIcon } from "@workspace/ui/components/icons/brands/FacebookIcon";
import { TikTokIcon } from "@workspace/ui/components/icons/brands/TikTokIcon";
import {
	InstagramIcon,
	LinkedinIcon,
	Mail,
	MapPin,
	Phone,
	XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function Footer({
	storeName,
	email,
	phone,
}: {
	storeName?: string;
	email?: string;
	phone?: string;
}) {
	const t = useTranslations("Footer");

	const footerLinks = {
		shop: [
			{ href: "/category/", label: t("categories") },
			{ href: "/products?sort=newest", label: t("newArrivals") },
			// { href: "/products?sort=popular", label: t("bestSellers") },
		],
		company: [
			{ href: "/about", label: t("aboutUs") },
			// { href: "/contact", label: t("contactUs") },
		],
		support: [
			// { href: "/help", label: t("helpCenter") },
			{ href: "/shipping", label: t("shipping") },
			{ href: "/returns", label: t("returns") },
			{ href: "/faq", label: t("faq") },
		],
		legal: [
			{ href: "/privacy", label: t("privacy") },
			{ href: "/terms", label: t("terms") },
			{ href: "/cookies", label: t("cookies") },
		],
	};

	const socialLinks = [
		{
			icon: FacebookIcon,
			href: "#",
			label: "Facebook",
			color: "hover:text-blue-500",
		},
		{ icon: XIcon, href: "#", label: "Twitter", color: "hover:text-sky-700" },
		{
			icon: InstagramIcon,
			href: "#",
			label: "Instagram",
			color: "hover:text-pink-500",
		},
		{
			icon: LinkedinIcon,
			href: "#",
			label: "LinkedIn",
			color: "hover:text-blue-600",
		},
		{
			icon: TikTokIcon,
			href: "#",
			label: "Tiktok",
			color: "hover:text-blue-600",
		},
	];

	return (
		<footer className="xm-auto mt-auto px-4 py-12 md:py-16">
			{/* Main Footer Content */}
			<div className="grid md:grid-cols-2 md:gap-12 lg:grid-cols-12 lg:gap-8 xl:gap-12">
				{/* Brand Section */}
				<div className="lg:col-span-6">
					<Link href="/" className="mb-6 inline-block">
						<h2 className="bg-linear-to-r from-primary to-primary/60 bg-clip-text font-bold text-3xl text-transparent tracking-tight">
							{storeName || t("brandName")}
						</h2>
					</Link>

					{/* Contact Info */}
					<div className="space-y-4">
						<div className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground">
							<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
								<MapPin className="h-4 w-4 shrink-0" />
							</div>
							<span className="font-medium text-sm">{t("address")}</span>
						</div>
						{phone && (
							<div className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground">
								<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
									<Phone className="h-4 w-4 shrink-0" />
								</div>
								<span className="font-medium text-sm">{phone}</span>
							</div>
						)}
						{email && (
							<div className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground">
								<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
									<Mail className="h-4 w-4 shrink-0" />
								</div>
								<span className="font-medium text-sm">{email}</span>
							</div>
						)}
					</div>
					{/* Social Links */}
					<div className="mt-8 flex items-center gap-2">
						{socialLinks.map((social) => (
							<Button
								key={social.label}
								variant="outline"
								size="icon"
								className={cn(
									"hover:-translate-y-1 h-10 w-10 rounded-full border-muted-foreground/20 bg-background transition-all hover:border-primary/50 hover:shadow-md",
									social.color,
								)}
								asChild
							>
								<a
									href={social.href}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={social.label}
								>
									<social.icon className="h-4 w-4" />
								</a>
							</Button>
						))}
					</div>
				</div>

				{/* Links Sections */}
				<div className="mt-12 flex flex-row flex-wrap content-start gap-10 md:mt-14 lg:col-span-6">
					{Object.entries(footerLinks).map(([key, links]) => (
						<div
							key={key}
							className="items-start gap-1 sm:flex-row sm:items-baseline sm:gap-4"
						>
							<ul className="flex flex-wrap gap-x-6 gap-y-1">
								{links.map((link) => (
									<li key={link.href}>
										<Link
											href={link.href}
											className="group flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-primary"
										>
											<span className="h-px w-0 bg-primary transition-all duration-300 group-hover:w-3" />
											<span className="transition-transform duration-300 group-hover:translate-x-1">
												{link.label}
											</span>
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</div>

			{/* Bottom Section */}
			<div className="mt-6 flex flex-col items-center justify-center gap-4 border-t pt-8 md:mt-12 md:flex-row">
				{/* Copyright */}
				<p className="text-center text-muted-foreground text-sm">
					© {new Date().getFullYear()} {storeName?.toUpperCase() || ""}.{" "}
					{t("allRightsReserved")}
				</p>
			</div>
		</footer>
	);
}
