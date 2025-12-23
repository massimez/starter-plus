"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useSession } from "@/lib/auth-client";
import { useDefaultLocation } from "@/lib/hooks/use-storefront";
import { CheckoutForm } from "./_components";

export default function CheckoutPage() {
	const _t = useTranslations("Navigation");
	const { data: session, isPending } = useSession();
	const router = useRouter();

	// Get organization ID from environment
	const organizationId = process.env.NEXT_PUBLIC_ORGANIZATION_ID || "";

	// Fetch default location for the organization
	const {
		data: defaultLocation,
		isLoading: isLocationLoading,
		error: locationError,
	} = useDefaultLocation(organizationId, !!organizationId);

	// Debug logging
	useEffect(() => {
		console.log("Organization ID:", organizationId);
		console.log("Location loading:", isLocationLoading);
		console.log("Location data:", defaultLocation);
		console.log("Location error:", locationError);
	}, [organizationId, isLocationLoading, defaultLocation, locationError]);

	useEffect(() => {
		if (!isPending && !session) {
			router.push("/login"); // Should redirect to login if not authenticated
		}
	}, [session, isPending, router]);

	if (isPending || isLocationLoading) {
		return (
			<div className="mx-auto flex min-h-[400px] items-center justify-center px-4 py-10">
				<div className="text-center">
					<div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-current border-r-transparent border-solid" />
					<p className="text-muted-foreground">Loading checkout...</p>
				</div>
			</div>
		);
	}

	if (!session) {
		return null; // Will redirect
	}

	if (!organizationId) {
		return (
			<div className="mx-auto px-4 py-10">
				<p className="text-destructive">
					Organization not configured. Please contact support.
				</p>
			</div>
		);
	}

	if (locationError || !defaultLocation) {
		return (
			<div className="mx-auto px-4 py-10">
				<p className="text-destructive">
					{locationError
						? "Failed to load location information. Please try again."
						: "No active location found. Please contact support."}
				</p>
			</div>
		);
	}

	return (
		<div className="mx-auto">
			<CheckoutForm
				organizationId={organizationId}
				locationId={defaultLocation.id}
				currency="USD"
			/>
		</div>
	);
}
