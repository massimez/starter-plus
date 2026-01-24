import { TestimonialCard } from "@workspace/ui/components/cards/testimonial-card";
import { useTranslations } from "next-intl";

export function TestimonialsSection() {
	const t = useTranslations("Testimonials");
	const testimonials = [
		{
			name: t("testimonials.0.name"),
			role: t("testimonials.0.role"),
			company: t("testimonials.0.company"),
			content: t("testimonials.0.content"),
			avatar: "👩‍💻",
		},
		{
			name: t("testimonials.1.name"),
			role: t("testimonials.1.role"),
			company: t("testimonials.1.company"),
			content: t("testimonials.1.content"),
			avatar: "👨‍💻",
		},
		{
			name: t("testimonials.2.name"),
			role: t("testimonials.2.role"),
			company: t("testimonials.2.company"),
			content: t("testimonials.2.content"),
			avatar: "👩‍🎨",
		},
	];

	return (
		<section className="py-20">
			<div className="container mx-auto px-4">
				<div className="mx-auto mb-16 max-w-2xl text-center">
					<h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
						{t("heading")}
					</h2>
					<p className="mt-4 text-lg text-muted-foreground">
						{t("subheading")}
					</p>
				</div>

				<div className="grid gap-8 md:grid-cols-3">
					{testimonials.map((testimonial) => (
						<TestimonialCard
							key={testimonial.name + testimonial.role}
							name={testimonial.name}
							role={testimonial.role}
							company={testimonial.company}
							content={testimonial.content}
							avatar={testimonial.avatar}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
