"use client";

import { Button } from "@workspace/ui/components/button";
import { useTranslations } from "next-intl";
import { CheckoutForm } from "@/components/features/cart/checkout/checkout-form";
import { useRouter } from "@/i18n/routing";
import { useSession } from "@/lib/auth-client";
import { useDefaultLocation } from "@/lib/hooks/use-storefront";
import { useStoreSettings } from "@/store/use-settings-store";

interface CheckoutSheetContentProps {
	onBack: () => void;
	onClose: () => void;
}

export function CheckoutSheetContent({
	onBack,
	onClose,
}: CheckoutSheetContentProps) {
	const t = useTranslations("Checkout");
	const { data: session, isPending } = useSession();
	const router = useRouter();
	const { currency } = useStoreSettings();

	// Get organization ID from environment
	const organizationId = process.env.NEXT_PUBLIC_ORGANIZATION_ID || "";

	// Fetch default location for the organization
	const {
		data: defaultLocation,
		isLoading: isLocationLoading,
		error: locationError,
	} = useDefaultLocation(organizationId, !!organizationId);

	if (isPending || isLocationLoading) {
		return (
			<div className="flex h-full items-center justify-center p-8">
				<div className="text-center">
					<div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-current border-r-transparent border-solid" />
					<p className="text-muted-foreground">{t("loading")}</p>
				</div>
			</div>
		);
	}

	if (!session) {
		return (
			<div className="flex h-full flex-col items-center justify-center p-8 text-center">
				<h3 className="mb-2 font-semibold text-lg">{t("authRequired")}</h3>
				<p className="mb-6 text-muted-foreground">{t("authMessage")}</p>
				<Button onClick={() => router.push("/login")}>{t("signIn")}</Button>
				<Button variant="ghost" onClick={onBack} className="mt-4">
					{t("backToCart")}
				</Button>
			</div>
		);
	}

	if (!organizationId) {
		return (
			<div className="p-8">
				<p className="text-destructive">
					Organization not configured. Please contact support.
				</p>
				<Button variant="ghost" onClick={onBack} className="mt-4">
					{t("backToCart")}
				</Button>
			</div>
		);
	}

	if (locationError || !defaultLocation) {
		return (
			<div className="p-8">
				<p className="text-destructive">
					{locationError
						? "Failed to load location information. Please try again."
						: "No active location found. Please contact support."}
				</p>
				<Button variant="ghost" onClick={onBack} className="mt-4">
					{t("backToCart")}
				</Button>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			<div className="min-h-0 flex-1">
				<CheckoutForm
					organizationId={organizationId}
					locationId={defaultLocation.id}
					currency={currency}
					onClose={onClose}
					onBack={onBack}
				/>
			</div>
		</div>
	);
}
