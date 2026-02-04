import { Button } from "@workspace/ui/components/button";
import { CardTitle } from "@workspace/ui/components/card";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { ArrowLeft, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { AddressSelector } from "@/components/features/address-selector";
import { MapAddressSelector } from "@/components/features/map-address";
import type { useSession } from "@/lib/auth-client";
import type { useProfile } from "@/lib/hooks/use-profile";
import type { Address as CheckoutAddress } from "./types";
import type { CheckoutFormValues } from "./validation";

interface ShippingStepProps {
	form: UseFormReturn<CheckoutFormValues>;
	session: ReturnType<typeof useSession>["data"];
	profile: ReturnType<typeof useProfile>["profile"];
	isProfileLoaded: boolean;

	selectedAddressIndex: string | undefined;
	saveAddress: boolean;

	onAddressSelect: (addressIndex: string | undefined) => void;
	onSaveAddressChange: (checked: boolean) => void;
	onBack?: () => void;
}

export function ShippingStep({
	form,
	session,
	profile,
	isProfileLoaded,
	selectedAddressIndex,
	saveAddress,
	onAddressSelect,
	onSaveAddressChange,
	onBack,
}: ShippingStepProps) {
	const t = useTranslations("Checkout.shipping");
	const [isMapSelected, setIsMapSelected] = useState(false);

	const hasSavedAddresses = !!profile?.addresses?.length;
	const isAuthenticated = !!session?.user;

	// Default to first saved address if user has addresses and nothing is selected
	useEffect(() => {
		if (hasSavedAddresses && selectedAddressIndex === undefined) {
			onAddressSelect("0");
		}
	}, [hasSavedAddresses, selectedAddressIndex, onAddressSelect]);

	const isUsingNewAddress =
		selectedAddressIndex === "new" ||
		isMapSelected ||
		(!hasSavedAddresses && selectedAddressIndex === undefined);

	// Memoized handler for map address selection
	const handleMapAddressSelect = useCallback(
		(address: CheckoutAddress) => {
			setIsMapSelected(true);
			onAddressSelect("new");

			// Batch form updates for better performance
			form.setValue("shippingAddress.street", address.street, {
				shouldValidate: true,
			});
			form.setValue("shippingAddress.city", address.city, {
				shouldValidate: true,
			});
			form.setValue("shippingAddress.state", address.state, {
				shouldValidate: true,
			});
			form.setValue("shippingAddress.postalCode", address.postalCode, {
				shouldValidate: true,
			});
			form.setValue("shippingAddress.country", address.country, {
				shouldValidate: true,
			});
			form.setValue("shippingAddress.lat", address.lat);
			form.setValue("shippingAddress.lng", address.lng);
		},
		[form, onAddressSelect],
	);

	// Handler for switching to saved addresses
	const handleSavedAddressSelect = useCallback(
		(index: string) => {
			setIsMapSelected(false);
			onAddressSelect(index);
		},
		[onAddressSelect],
	);

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center gap-2">
				{onBack && (
					<Button
						variant="ghost"
						size="icon"
						onClick={onBack}
						className="h-8 w-8"
						aria-label={t("back") || "Go back"}
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
				)}

				<CardTitle className="flex items-center gap-3 text-xl">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
						<Truck className="h-5 w-5 text-primary" />
					</div>
					{t("title")}
				</CardTitle>
			</div>

			<div className="space-y-3">
				{/* Saved addresses section */}
				{isAuthenticated && hasSavedAddresses && (
					<div className="">
						{!isUsingNewAddress ? (
							<div className="space-y-4 rounded-xl border-2 bg-muted/30 p-6">
								<AddressSelector
									addresses={profile.addresses || []}
									selectedValue={selectedAddressIndex}
									onSelect={handleSavedAddressSelect}
								/>
							</div>
						) : (
							<Button
								type="button"
								variant="outline"
								onClick={() => handleSavedAddressSelect("0")}
								className=""
							>
								<ArrowLeft className="mr-1 h-4 w-4" />
								{t("useSavedAddress") || "Use a saved address"}
							</Button>
						)}
					</div>
				)}

				{/* New address form */}
				{isUsingNewAddress && (
					<div className="space-y-6">
						{/* Map selector */}
						<div className="relative rounded-xl">
							<MapAddressSelector onSelect={handleMapAddressSelect} />
						</div>

						{/* Divider */}
						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-background px-2 text-muted-foreground">
									{t("manual") || "Or enter manually"}
								</span>
							</div>
						</div>

						{/* Manual address fields */}
						<div className="space-y-6">
							<FormField
								control={form.control}
								name="shippingAddress.street"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="font-semibold text-sm">
											{t("street")} *
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												className="h-12 rounded-lg border-2 px-4 text-base focus:ring-2 focus:ring-primary/20"
												autoComplete="street-address"
											/>
										</FormControl>
										<FormMessage className="mt-1.5" />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
								<FormField
									control={form.control}
									name="shippingAddress.city"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="font-semibold text-sm">
												{t("city")} *
											</FormLabel>
											<FormControl>
												<Input
													{...field}
													className="h-12 rounded-lg border-2 px-4 text-base focus:ring-2 focus:ring-primary/20"
													autoComplete="address-level2"
												/>
											</FormControl>
											<FormMessage className="mt-1.5" />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="shippingAddress.state"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="font-semibold text-sm">
												{t("state")} *
											</FormLabel>
											<FormControl>
												<Input
													{...field}
													className="h-12 rounded-lg border-2 px-4 text-base focus:ring-2 focus:ring-primary/20"
													autoComplete="address-level1"
												/>
											</FormControl>
											<FormMessage className="mt-1.5" />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
								<FormField
									control={form.control}
									name="shippingAddress.postalCode"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="font-semibold text-sm">
												{t("postalCode")} *
											</FormLabel>
											<FormControl>
												<Input
													{...field}
													className="h-12 rounded-lg border-2 px-4 text-base focus:ring-2 focus:ring-primary/20"
													autoComplete="postal-code"
												/>
											</FormControl>
											<FormMessage className="mt-1.5" />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="shippingAddress.country"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="font-semibold text-sm">
												{t("country")} *
											</FormLabel>
											<FormControl>
												<Input
													{...field}
													className="h-12 rounded-lg border-2 px-4 text-base focus:ring-2 focus:ring-primary/20"
													autoComplete="country-name"
												/>
											</FormControl>
											<FormMessage className="mt-1.5" />
										</FormItem>
									)}
								/>
							</div>
						</div>
					</div>
				)}

				{/* Save address checkbox */}
				{isAuthenticated && isProfileLoaded && isUsingNewAddress && (
					<div className="flex items-center space-x-3 rounded-lg bg-muted/30 p-4">
						<Checkbox
							id="save-address"
							checked={saveAddress}
							onCheckedChange={(checked) => {
								if (checked !== "indeterminate") {
									onSaveAddressChange(checked);
								}
							}}
							className="h-5 w-5"
						/>
						<label
							htmlFor="save-address"
							className="cursor-pointer font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						>
							{t("saveAddress")}
						</label>
					</div>
				)}

				{/* Guest user message */}
				{!isAuthenticated && (
					<div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
						<p className="text-blue-900 text-sm dark:text-blue-100">
							{t("guestMessage") ||
								"Sign in to save addresses for faster checkout next time."}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
