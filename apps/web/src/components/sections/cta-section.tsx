import { Github, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

export function CTASection() {
	const t = useTranslations("CTA");
	return (
		<section className="bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 py-20">
			<div className="container mx-auto px-4 text-center">
				<div className="mx-auto max-w-2xl text-white">
					<Zap className="mx-auto mb-6 h-16 w-16 opacity-90" />
					<h2 className="mb-4 font-bold text-3xl tracking-tight sm:text-4xl">
						{t("heading")}
					</h2>
					<p className="mb-8 text-xl opacity-90">{t("subheading")}</p>

					<div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
						<button className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-8 py-3 font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20">
							<Github className="h-5 w-5" />
							{t("cta.github")}
						</button>
					</div>
				</div>
			</div>
		</section>
	);
}
