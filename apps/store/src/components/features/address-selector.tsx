"use client";

import { Label } from "@workspace/ui/components/label";
import {
	RadioGroup,
	RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import { MapPin } from "lucide-react";
import type { Address } from "@/lib/storefront-types";

interface AddressSelectorProps {
	addresses: Address[];
	onSelect: (value: string) => void;
	selectedValue?: string;
}

export function AddressSelector({
	addresses,
	onSelect,
	selectedValue,
}: AddressSelectorProps) {
	const formatAddress = (address: Address) => {
		const parts = [address.city, address.state, address.postalCode].filter(
			Boolean,
		);
		return parts.join(", ");
	};

	if (addresses.length === 0) {
		return null;
	}

	return (
		<div className="space-y-3">
			<Label className="font-semibold text-base">Choose a saved address</Label>
			<RadioGroup
				value={selectedValue}
				onValueChange={onSelect}
				className="space-y-3"
			>
				{/* New Address Option */}
				<div className="relative">
					<RadioGroupItem
						value="new"
						id="address-new"
						className="peer sr-only"
					/>
					<Label
						htmlFor="address-new"
						className="flex cursor-pointer items-start gap-4 rounded-xl border-2 border-dashed p-4 transition-all hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
					>
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
							<MapPin className="h-5 w-5 text-primary" />
						</div>
						<div className="flex-1 space-y-1">
							<p className="font-semibold text-sm">Enter new address</p>
							<p className="text-muted-foreground text-xs">
								Manually enter a new shipping address
							</p>
						</div>
					</Label>
				</div>

				{/* Saved Addresses */}
				{addresses.map((address, index) => (
					<div
						key={`${address.street}-${address.postalCode}-${index}`}
						className="relative"
					>
						<RadioGroupItem
							value={index.toString()}
							id={`address-${index}`}
							className="peer sr-only"
						/>
						<Label
							htmlFor={`address-${index}`}
							className="flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition-all hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:shadow-sm"
						>
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
								<MapPin className="h-5 w-5 text-primary" />
							</div>
							<div className="flex-1 space-y-1">
								<div className="flex items-center gap-2">
									<p className="font-semibold text-sm capitalize">
										{address.type}
									</p>
									{address.isDefault && (
										<span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
											Default
										</span>
									)}
								</div>
								<p className="text-foreground text-sm">{address.street}</p>
								<p className="text-muted-foreground text-xs">
									{formatAddress(address)}, {address.country}
								</p>
							</div>
						</Label>
					</div>
				))}
			</RadioGroup>
		</div>
	);
}
