import { useLocale } from "next-intl";
import { useCallback } from "react";
import { useStoreSettings } from "@/store/use-settings-store";

export function useFormatPrice() {
	const { currency } = useStoreSettings();
	const locale = useLocale();
	console.log(locale);
	const formatPrice = useCallback(
		(price: number | undefined | null) => {
			if (price === undefined || price === null) return "";
			return new Intl.NumberFormat(locale, {
				style: "currency",
				currency: currency,
			}).format(price);
		},
		[currency, locale],
	);

	return { formatPrice };
}
