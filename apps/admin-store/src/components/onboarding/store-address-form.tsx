"use client";

import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { hc } from "@/lib/api-client";

export interface AddressStepData {
	street: string;
	city: string;
	state: string;
	zipCode: string;
	country: string;
	phone: string;
}

const countries = [
	{ value: "US", label: "United States" },
	{ value: "CA", label: "Canada" },
	{ value: "GB", label: "United Kingdom" },
	{ value: "AU", label: "Australia" },
	{ value: "FR", label: "France" },
	{ value: "DE", label: "Germany" },
	{ value: "IT", label: "Italy" },
	{ value: "ES", label: "Spain" },
	{ value: "NL", label: "Netherlands" },
	{ value: "BE", label: "Belgium" },
	{ value: "CH", label: "Switzerland" },
	{ value: "AT", label: "Austria" },
	{ value: "SE", label: "Sweden" },
	{ value: "NO", label: "Norway" },
	{ value: "DK", label: "Denmark" },
	{ value: "FI", label: "Finland" },
	{ value: "PL", label: "Poland" },
	{ value: "CZ", label: "Czech Republic" },
	{ value: "PT", label: "Portugal" },
	{ value: "GR", label: "Greece" },
	{ value: "IE", label: "Ireland" },
	{ value: "NZ", label: "New Zealand" },
	{ value: "JP", label: "Japan" },
	{ value: "KR", label: "South Korea" },
	{ value: "SG", label: "Singapore" },
	{ value: "HK", label: "Hong Kong" },
	{ value: "IN", label: "India" },
	{ value: "BR", label: "Brazil" },
	{ value: "MX", label: "Mexico" },
	{ value: "AR", label: "Argentina" },
	{ value: "DZ", label: "Algeria" },
];

export function StoreAddressForm({
	organizationId,
	onSubmit,
}: {
	organizationId: string;
	onSubmit: (data: AddressStepData) => Promise<void>;
}) {
	const [loading, setLoading] = React.useState(false);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLoading(true);
		const formData = new FormData(event.currentTarget);

		const addressData = {
			street: formData.get("street") as string,
			city: formData.get("city") as string,
			state: formData.get("state") as string,
			zipCode: formData.get("zipCode") as string,
			country: formData.get("country") as string,
			phone: formData.get("phone") as string,
		};

		try {
			const response = await hc.api.organizations.locations.$post({
				json: {
					name: "Main Store",
					locationType: "shop",
					organizationId: organizationId,
					isDefault: true,
					isActive: true,
					address: {
						street: addressData.street,
						city: addressData.city,
						state: addressData.state,
						zipCode: addressData.zipCode,
						country: addressData.country,
					},
					contactPhone: addressData.phone,
				},
			});

			if (!response.ok) {
				await response.json();
				throw new Error("Failed to create location");
			}

			toast.success("Store location created successfully!");
			await onSubmit(addressData);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to create store location",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="border-border/50 shadow-xl">
			<CardHeader>
				<CardTitle className="text-2xl">Where is your store based?</CardTitle>
				<CardDescription>
					Add your primary business location. You can add more locations later.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form id="address-form" onSubmit={handleSubmit} className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="country">Country / Region</Label>
							<Select name="country" required defaultValue="US">
								<SelectTrigger id="country" disabled={loading}>
									<SelectValue placeholder="Select country" />
								</SelectTrigger>
								<SelectContent>
									{countries.map((country) => (
										<SelectItem key={country.value} value={country.value}>
											{country.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="phone">Phone Number</Label>
							<Input
								id="phone"
								name="phone"
								type="tel"
								placeholder="+1 (555) 000-0000"
								disabled={loading}
								required
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="street">Address</Label>
						<Input
							id="street"
							name="street"
							placeholder="Street address, P.O. box, etc."
							disabled={loading}
							required
						/>
					</div>

					<div className="grid grid-cols-2 gap-4 md:grid-cols-3">
						<div className="space-y-2">
							<Label htmlFor="city">City</Label>
							<Input
								id="city"
								name="city"
								placeholder="City"
								disabled={loading}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="state">State / Province</Label>
							<Input
								id="state"
								name="state"
								placeholder="State"
								disabled={loading}
								required
							/>
						</div>
						<div className="col-span-2 space-y-2 md:col-span-1">
							<Label htmlFor="zipCode">ZIP / Postal Code</Label>
							<Input
								id="zipCode"
								name="zipCode"
								placeholder="ZIP"
								disabled={loading}
								required
							/>
						</div>
					</div>
				</form>
			</CardContent>
			<CardFooter className="flex justify-between border-t bg-muted/5 p-6">
				<Button type="submit" form="address-form" disabled={loading} size="lg">
					{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					Create & Finish
				</Button>
			</CardFooter>
		</Card>
	);
}
