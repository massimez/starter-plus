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
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { AddressSelector } from "@/components/features/address-selector";
import { MapAddressSelector } from "@/components/features/map-address";
import type { useSession } from "@/lib/auth-client";
import type { useProfile } from "@/lib/hooks/use-profile";
import type { CheckoutFormValues } from "./validation";

interface ShippingStepProps {
	form: UseFormReturn<CheckoutFormValues>;
	session: ReturnType<typeof useSession>["data"];
	profile: ReturnType<typeof useProfile>["profile"];
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
	selectedAddressIndex,
	saveAddress,
	onSaveAddressChange,
	isProfileLoaded,
	onBack,
	onAddressSelect,
}: ShippingStepProps & { isProfileLoaded: boolean }) {
	const t = useTranslations("Checkout.shipping");
	const [isMapSelected, setIsMapSelected] = useState(false);
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				{onBack && (
					<Button
						variant="ghost"
						size="icon"
						onClick={onBack}
						className="h-8 w-8"
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
			<div className="space-y-6">
				{session?.user &&
					profile?.addresses &&
					profile.addresses.length > 0 &&
					!isMapSelected && (
						<div className="mb-6 rounded-xl border-2 bg-muted/30 p-6">
							<AddressSelector
								addresses={profile.addresses}
								onSelect={(index: string) => {
									onAddressSelect(index);
									setIsMapSelected(false);
								}}
								selectedValue={selectedAddressIndex}
							/>
						</div>
					)}

				{(selectedAddressIndex === undefined ||
					selectedAddressIndex === "new") && (
					<div className="space-y-6">
						{/* Map Selector */}
						<div className="relative rounded-xl">
							<MapAddressSelector
								onSelect={(address) => {
									setIsMapSelected(true);
									form.setValue("shippingAddress.street", address.street);
									form.setValue("shippingAddress.city", address.city);
									form.setValue("shippingAddress.state", address.state);
									form.setValue(
										"shippingAddress.postalCode",
										address.postalCode,
									);
									form.setValue("shippingAddress.country", address.country);
									form.setValue("shippingAddress.lat", address.lat);
									form.setValue("shippingAddress.lng", address.lng);
								}}
							/>
						</div>

						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-background px-2 text-muted-foreground">
									{t("manual")}
								</span>
							</div>
						</div>

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
											placeholder={t("streetPlaceholder")}
											className="h-12 rounded-lg border-2 px-4 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
											{...field}
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
												placeholder={t("cityPlaceholder")}
												className="h-12 rounded-lg border-2 px-4 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
												{...field}
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
												placeholder={t("statePlaceholder")}
												className="h-12 rounded-lg border-2 px-4 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
												{...field}
											/>
										</FormControl>
										<FormMessage className="mt-1.5" />
									</FormItem>
								)}
							/>
						</div>

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
											placeholder={t("postalCodePlaceholder")}
											className="h-12 rounded-lg border-2 px-4 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
											{...field}
										/>
									</FormControl>
									<FormMessage className="mt-1.5" />
								</FormItem>
							)}
						/>
					</div>
				)}

				{session?.user &&
					isProfileLoaded &&
					(selectedAddressIndex === "new" ||
						selectedAddressIndex === undefined) && (
						<div className="flex items-center space-x-3 rounded-lg bg-muted/30 p-4 pt-4">
							<Checkbox
								id="save-address"
								checked={saveAddress}
								onCheckedChange={(checked) =>
									onSaveAddressChange(checked as boolean)
								}
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
			</div>
		</div>
	);
}
