// app/page.tsx

import {
	CodePreviewSection,
	CTASection,
	FeaturesSection,
	HeroSection,
	TestimonialsSection,
} from "@/app/[locale]/(landing)/_components/sections";

export default function HomePage() {
	return (
		<div className="overflow-hidden">
			<HeroSection />
			<FeaturesSection />
			<CodePreviewSection />
			<TestimonialsSection />
			<CTASection />
		</div>
	);
}
