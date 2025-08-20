// app/page.tsx

import {
	CodePreviewSection,
	CTASection,
	FeaturesSection,
	HeroSection,
	TestimonialsSection,
} from "@/components/sections";

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
