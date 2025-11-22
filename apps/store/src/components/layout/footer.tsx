"use client";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
	Facebook,
	Github,
	Instagram,
	Linkedin,
	Mail,
	MapPin,
	Phone,
	Send,
	Twitter,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function Footer() {
	const t = useTranslations("Footer");
	const [email, setEmail] = useState("");

	const handleNewsletterSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (email) {
			toast.success(t("newsletterSuccess"));
			setEmail("");
		}
	};

	const footerLinks = {
		shop: [
			{ href: "/products", label: t("allProducts") },
			{ href: "/categories/all", label: t("categories") },
			{ href: "/products?sort=newest", label: t("newArrivals") },
			{ href: "/products?sort=popular", label: t("bestSellers") },
		],
		company: [
			{ href: "/about", label: t("aboutUs") },
			{ href: "/contact", label: t("contactUs") },
			{ href: "/careers", label: t("careers") },
			{ href: "/blog", label: t("blog") },
		],
		support: [
			{ href: "/help", label: t("helpCenter") },
			{ href: "/shipping", label: t("shipping") },
			{ href: "/returns", label: t("returns") },
			{ href: "/faq", label: t("faq") },
		],
		legal: [
			{ href: "/privacy", label: t("privacy") },
			{ href: "/terms", label: t("terms") },
			{ href: "/cookies", label: t("cookies") },
			{ href: "/accessibility", label: t("accessibility") },
		],
	};

	const socialLinks = [
		{
			icon: Facebook,
			href: "#",
			label: "Facebook",
			color: "hover:text-blue-500",
		},
		{ icon: Twitter, href: "#", label: "Twitter", color: "hover:text-sky-700" },
		{
			icon: Instagram,
			href: "#",
			label: "Instagram",
			color: "hover:text-pink-500",
		},
		{
			icon: Linkedin,
			href: "#",
			label: "LinkedIn",
			color: "hover:text-blue-600",
		},
		{
			icon: Github,
			href: "#",
			label: "GitHub",
			color: "hover:text-gray-600 dark:hover:text-purple-600",
		},
	];

	return (
		<footer className="relative mt-auto border-t bg-linear-to-b from-background to-muted/20">
			{/* Decorative gradient overlay */}
			<div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-secondary/5" />

			<div className="container relative mx-auto px-4 py-12 md:py-16">
				{/* Main Footer Content */}
				<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-12">
					{/* Brand Section */}
					<div className="lg:col-span-4">
						<Link href="/" className="mb-4 inline-block">
							<h2 className="bg-linear-to-r from-primary to-primary/60 bg-clip-text font-bold text-2xl text-transparent">
								STORE
							</h2>
						</Link>
						<p className="mb-6 text-muted-foreground text-sm leading-relaxed">
							{t("brandDescription")}
						</p>

						{/* Contact Info */}
						<div className="space-y-3">
							<div className="flex items-center gap-3 text-muted-foreground text-sm transition-colors hover:text-foreground">
								<MapPin className="h-4 w-4 shrink-0" />
								<span>{t("address")}</span>
							</div>
							<div className="flex items-center gap-3 text-muted-foreground text-sm transition-colors hover:text-foreground">
								<Phone className="h-4 w-4 shrink-0" />
								<span>+1 (555) 123-4567</span>
							</div>
							<div className="flex items-center gap-3 text-muted-foreground text-sm transition-colors hover:text-foreground">
								<Mail className="h-4 w-4 shrink-0" />
								<span>support@store.com</span>
							</div>
						</div>
					</div>

					{/* Links Sections */}
					<div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
						{/* Shop */}
						<div>
							<h3 className="mb-4 font-semibold text-foreground text-sm uppercase tracking-wider">
								{t("shop")}
							</h3>
							<ul className="space-y-3">
								{footerLinks.shop.map((link) => (
									<li key={link.href}>
										<Link
											href={link.href}
											className="text-muted-foreground text-sm transition-colors hover:text-primary"
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Company */}
						<div>
							<h3 className="mb-4 font-semibold text-foreground text-sm uppercase tracking-wider">
								{t("company")}
							</h3>
							<ul className="space-y-3">
								{footerLinks.company.map((link) => (
									<li key={link.href}>
										<Link
											href={link.href}
											className="text-muted-foreground text-sm transition-colors hover:text-primary"
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Support */}
						<div>
							<h3 className="mb-4 font-semibold text-foreground text-sm uppercase tracking-wider">
								{t("support")}
							</h3>
							<ul className="space-y-3">
								{footerLinks.support.map((link) => (
									<li key={link.href}>
										<Link
											href={link.href}
											className="text-muted-foreground text-sm transition-colors hover:text-primary"
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Legal */}
						<div>
							<h3 className="mb-4 font-semibold text-foreground text-sm uppercase tracking-wider">
								{t("legal")}
							</h3>
							<ul className="space-y-3">
								{footerLinks.legal.map((link) => (
									<li key={link.href}>
										<Link
											href={link.href}
											className="text-muted-foreground text-sm transition-colors hover:text-primary"
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>

				{/* Newsletter Section */}
				<div className="mt-12 border-t pt-8">
					<div className="mx-auto max-w-md">
						<h3 className="mb-2 text-center font-semibold text-foreground">
							{t("newsletterTitle")}
						</h3>
						<p className="mb-4 text-center text-muted-foreground text-sm">
							{t("newsletterDescription")}
						</p>
						<form onSubmit={handleNewsletterSubmit} className="flex gap-2">
							<Input
								type="email"
								placeholder={t("emailPlaceholder")}
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="flex-1"
							/>
							<Button type="submit" size="icon" className="shrink-0">
								<Send className="h-4 w-4" />
								<span className="sr-only">{t("subscribe")}</span>
							</Button>
						</form>
					</div>
				</div>

				{/* Bottom Section */}
				<div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
					{/* Copyright */}
					<p className="text-center text-muted-foreground text-sm">
						© {new Date().getFullYear()} STORE. {t("allRightsReserved")}
					</p>

					{/* Social Links */}
					<div className="flex items-center gap-2">
						{socialLinks.map((social) => (
							<Button
								key={social.label}
								variant="ghost"
								size="icon"
								className={cn("transition-all hover:scale-110", social.color)}
								asChild
							>
								<a
									href={social.href}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={social.label}
								>
									<social.icon className="size-6" />
								</a>
							</Button>
						))}
					</div>

					{/* Payment Methods */}
					<div className="flex items-center gap-2">
						<span className="text-muted-foreground text-xs">
							{t("weAccept")}
						</span>
						<div className="flex gap-1">
							{["💳", "💰", "🏦", "📱"].map((emoji) => (
								<div
									key={emoji}
									className="flex h-8 w-10 items-center justify-center rounded border bg-background text-lg"
								>
									{emoji}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
