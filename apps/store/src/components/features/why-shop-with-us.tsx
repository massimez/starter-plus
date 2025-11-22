import {
	Card,
} from "@workspace/ui/components/card";
import {
	CreditCard,
	Headphones,
	Lock,
	RotateCcw,
	Shield,
	Star,
	Truck,
} from "lucide-react";
import { useTranslations } from "next-intl";

const advantages = [
	{
		icon: Shield,
		titleKey: "productGuaranteeTitle",
		descriptionKey: "productGuaranteeDescription",
	},
	{
		icon: Truck,
		titleKey: "freeDeliveryTitle",
		descriptionKey: "freeDeliveryDescription",
	},
	{
		icon: RotateCcw,
		titleKey: "easyRefundsTitle",
		descriptionKey: "easyRefundsDescription",
	},
	{
		icon: Lock,
		titleKey: "securePaymentsTitle",
		descriptionKey: "securePaymentsDescription",
	},
	{
		icon: CreditCard,
		titleKey: "paymentOnDeliveryTitle",
		descriptionKey: "paymentOnDeliveryDescription",
	},
	{
		icon: Star,
		titleKey: "bonusPointsTitle",
		descriptionKey: "bonusPointsDescription",
	},
	{
		icon: Headphones,
		titleKey: "support24Title",
		descriptionKey: "support24Description",
	},
];

export function WhyShopWithUs() {
	const t = useTranslations("Advantages");

	return (
		<section className="py-16">
			<div className="container mx-auto px-4">
				<div className="mb-12 text-center">
					<h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
						{t("title")}
					</h2>
					<div className="mx-auto mt-4 h-1 w-20 rounded bg-primary" />
				</div>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{advantages.map((advantage) => {
						const Icon = advantage.icon;
						return (
							<Card
								key={advantage.titleKey}
								className="group hover:-translate-y-1 relative overflow-hidden border-muted/40 bg-card/50 transition-all duration-300 hover:border-primary/20 hover:bg-card hover:shadow-lg"
							>
								<div className="flex items-start gap-4 p-5">
									<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
										<Icon size={24} strokeWidth={2} />
									</div>
									<div className="space-y-1">
										<h3 className="font-semibold leading-none tracking-tight">
											{t(advantage.titleKey)}
										</h3>
										<p className="text-muted-foreground text-sm leading-relaxed">
											{t(advantage.descriptionKey)}
										</p>
									</div>
								</div>
							</Card>
						);
					})}
				</div>
			</div>
		</section>
	);
}
