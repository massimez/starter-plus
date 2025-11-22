"use client";

import { Card, CardContent } from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { useTranslations } from "next-intl";

interface CartSummaryProps {
	subtotal: number;
	taxes: number;
	total: number;
}

export function CartSummary({ subtotal, taxes, total }: CartSummaryProps) {
	const t = useTranslations("Cart");

	return (
		<Card>
			<CardContent className="space-y-2">
				{/* Subtotal */}
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">{t("subtotal")}</span>
					<span className="font-medium">${subtotal.toFixed(2)}</span>
				</div>

				{/* Taxes (Optional) */}
				{taxes > 0 && (
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">{t("taxes")}</span>
						<span className="font-medium">${taxes.toFixed(2)}</span>
					</div>
				)}

				{/* Separator */}
				<Separator />

				{/* Total */}
				<div className="flex items-center justify-between font-semibold text-base">
					<span>{t("total")}</span>
					<span className="font-bold text-lg text-primary">
						${total.toFixed(2)}
					</span>
				</div>
			</CardContent>
		</Card>
	);
}
