import { Zap } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

export const FooterMain = () => {
	const t = useTranslations("Footer");
	return (
		<footer className="border-t bg-background/50 backdrop-blur-sm">
			<div className="container mx-auto px-4 py-12">
				<div className="grid grid-cols-1 gap-8 md:grid-cols-4">
					{/* Brand */}
					<div className="space-y-4">
						<div className="flex items-center space-x-3">
							<div className="relative">
								<div className="-inset-1 absolute rounded-lg bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-75 blur" />
								<div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-background">
									<Zap className="h-5 w-5 text-primary" />
								</div>
							</div>
							<span className="font-bold text-lg">{t("brand")}</span>
						</div>
						<p className="text-muted-foreground text-sm">{t("description")}</p>
					</div>

					{/* Quick Links */}
					<div className="space-y-4">
						<h3 className="font-semibold text-sm">{t("quickLinks.title")}</h3>
						<ul className="space-y-2 text-muted-foreground text-sm">
							<li>
								<Link
									href="/docs"
									className="transition-colors hover:text-foreground"
								>
									{t("quickLinks.documentation")}
								</Link>
							</li>
							<li>
								<Link
									href="/examples"
									className="transition-colors hover:text-foreground"
								>
									{t("quickLinks.examples")}
								</Link>
							</li>
							<li>
								<Link
									href="/changelog"
									className="transition-colors hover:text-foreground"
								>
									{t("quickLinks.changelog")}
								</Link>
							</li>
							<li>
								<Link
									href="/support"
									className="transition-colors hover:text-foreground"
								>
									{t("quickLinks.support")}
								</Link>
							</li>
						</ul>
					</div>

					{/* Resources */}
					<div className="space-y-4">
						<h3 className="font-semibold text-sm">{t("resources.title")}</h3>
						<ul className="space-y-2 text-muted-foreground text-sm">
							<li>
								<Link
									href="/blog"
									className="transition-colors hover:text-foreground"
								>
									{t("resources.blog")}
								</Link>
							</li>
							<li>
								<Link
									href="/guides"
									className="transition-colors hover:text-foreground"
								>
									{t("resources.guides")}
								</Link>
							</li>
							<li>
								<Link
									href="/templates"
									className="transition-colors hover:text-foreground"
								>
									{t("resources.templates")}
								</Link>
							</li>
							<li>
								<Link
									href="/community"
									className="transition-colors hover:text-foreground"
								>
									{t("resources.community")}
								</Link>
							</li>
						</ul>
					</div>

					{/* Legal */}
					<div className="space-y-4">
						<h3 className="font-semibold text-sm">{t("legal.title")}</h3>
						<ul className="space-y-2 text-muted-foreground text-sm">
							<li>
								<Link
									href="/privacy"
									className="transition-colors hover:text-foreground"
								>
									{t("legal.privacyPolicy")}
								</Link>
							</li>
							<li>
								<Link
									href="/terms"
									className="transition-colors hover:text-foreground"
								>
									{t("legal.termsOfService")}
								</Link>
							</li>
							<li>
								<Link
									href="/cookies"
									className="transition-colors hover:text-foreground"
								>
									{t("legal.cookiePolicy")}
								</Link>
							</li>
							<li>
								<Link
									href="/license"
									className="transition-colors hover:text-foreground"
								>
									{t("legal.license")}
								</Link>
							</li>
						</ul>
					</div>
				</div>

				<div className="mt-8 border-t pt-8 text-center text-muted-foreground text-sm">
					<p>
						{"\u00A9"} {new Date().getFullYear()} {t("brand")}. {t("copyright")}
					</p>
				</div>
			</div>
		</footer>
	);
};
