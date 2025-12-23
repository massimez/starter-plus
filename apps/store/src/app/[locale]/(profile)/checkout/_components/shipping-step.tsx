import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Truck } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { AddressSelector } from "@/components/features/address-selector";
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
}

export function ShippingStep({
	form,
	session,
	profile,
	selectedAddressIndex,
	saveAddress,
	onAddressSelect,
	onSaveAddressChange,
}: ShippingStepProps) {
	return (
		<div className="space-y-4">
			<CardTitle className="flex items-center gap-3 text-xl">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<Truck className="h-5 w-5 text-primary" />
				</div>
				Shipping Address
			</CardTitle>
			<div className="space-y-6">
				{session?.user &&
					profile?.addresses &&
					profile.addresses.length > 0 && (
						<div className="mb-6 rounded-xl border-2 bg-muted/30 p-6">
							<AddressSelector
								addresses={profile.addresses}
								onSelect={onAddressSelect}
								selectedValue={selectedAddressIndex}
							/>
						</div>
					)}

				{(selectedAddressIndex === undefined ||
					selectedAddressIndex === "new") && (
					<>
						<FormField
							control={form.control}
							name="shippingAddress.street"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="font-semibold text-sm">
										Street Address *
									</FormLabel>
									<FormControl>
										<Input
											placeholder="123 Main Street"
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
											City *
										</FormLabel>
										<FormControl>
											<Input
												placeholder="New York"
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
											State/Province *
										</FormLabel>
										<FormControl>
											<Input
												placeholder="NY"
												className="h-12 rounded-lg border-2 px-4 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
												{...field}
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
								name="shippingAddress.country"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="font-semibold text-sm">
											Country *
										</FormLabel>
										<FormControl>
											<Input
												placeholder="United States"
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
								name="shippingAddress.postalCode"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="font-semibold text-sm">
											Postal Code *
										</FormLabel>
										<FormControl>
											<Input
												placeholder="10001"
												className="h-12 rounded-lg border-2 px-4 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
												{...field}
											/>
										</FormControl>
										<FormMessage className="mt-1.5" />
									</FormItem>
								)}
							/>
						</div>
					</>
				)}

				{session?.user &&
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
								Save this address to my profile
							</label>
						</div>
					)}

				<FormField
					control={form.control}
					name="useDifferentBilling"
					render={({ field }) => (
						<FormItem className="flex items-center space-x-3 rounded-lg border-2 border-dashed p-4 pt-4">
							<FormControl>
								<Checkbox
									checked={field.value}
									onCheckedChange={field.onChange}
									className="h-5 w-5"
								/>
							</FormControl>
							<FormLabel className="cursor-pointer font-medium text-sm">
								Use different billing address
							</FormLabel>
						</FormItem>
					)}
				/>
			</div>
		</div>
	);
}
