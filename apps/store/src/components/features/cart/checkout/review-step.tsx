import { CardTitle } from "@workspace/ui/components/card";
import { CreditCard, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormatPrice } from "@/lib/hooks/use-format-price";
import type { CheckoutFormValues } from "./validation";

interface ReviewStepProps {
	formValues: CheckoutFormValues;
	total: number;
}

export function ReviewStep({ formValues, total }: ReviewStepProps) {
	const tReview = useTranslations("Checkout.review");
	const tPayment = useTranslations("Checkout.payment");
	const { formatPrice } = useFormatPrice();

	return (
		<div className="">
			<CardTitle className="text-xl">{tReview("title")}</CardTitle>
			<div className="mt-4 space-y-4">
				{/* Shipping Address Summary */}
				<div>
					<h3 className="mb-3 flex items-center gap-2 font-bold text-base">
						<Truck className="h-5 w-5 text-primary" />
						{tReview("shippingAddress")}
					</h3>
					<div className="rounded-xl border-2 bg-muted/30 p-4 text-sm">
						<p className="font-semibold text-foreground">
							{formValues.customerInfo.fullName}
						</p>
						<p className="text-muted-foreground">
							{formValues.shippingAddress.street}
						</p>
						<p className="text-muted-foreground">
							{formValues.shippingAddress.city},{" "}
							{formValues.shippingAddress.state}{" "}
							{formValues.shippingAddress.postalCode}
						</p>
						<p className="text-muted-foreground">
							{formValues.shippingAddress.country}
						</p>
						<p className="mt-3 font-medium text-foreground">
							{formValues.customerInfo.email}
						</p>
						{formValues.customerInfo.phone && (
							<p className="text-muted-foreground">
								{formValues.customerInfo.phone}
							</p>
						)}
					</div>
				</div>

				{/* Payment Summary */}
				<div>
					<h3 className="mb-3 flex items-center gap-2 font-bold text-base">
						<CreditCard className="h-5 w-5 text-primary" />
						{tReview("paymentMethod")}
					</h3>
					<div className="flex items-center gap-3 rounded-xl border-2 bg-linear-to-br from-blue-50 to-cyan-50 p-4 shadow-sm dark:from-blue-950/30 dark:to-cyan-950/30">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white">
							<span className="font-bold text-lg">$</span>
						</div>
						<span className="font-semibold">{tPayment("cod")}</span>
					</div>
				</div>

				{/* Order Summary */}
				<div className="rounded-xl border-2 bg-primary/5 p-6">
					<div className="flex items-center justify-between font-bold text-xl">
						<span>{tReview("total")}</span>
						<span className="text-primary">{formatPrice(total)}</span>
					</div>
				</div>
			</div>
		</div>
	);
}
