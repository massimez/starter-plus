import { useLocale } from "next-intl";
import { useCallback } from "react";
import { useStoreSettings } from "@/store/use-settings-store";

export function useFormatPrice() {
	const { currency } = useStoreSettings();
	const locale = useLocale();
	const formatPrice = useCallback(
		(price: number | undefined | null) => {
			const code = locale === "fr" ? "fr-DZ" : locale;
			if (price === undefined || price === null) return "";
			return new Intl.NumberFormat(code, {
				style: "currency",
				currency: currency,
				minimumFractionDigits: currency === "DZD" ? 0 : 2,
				maximumFractionDigits: currency === "DZD" ? 0 : 2,
			}).format(price);
		},
		[currency, locale],
	);

	return { formatPrice };
}
