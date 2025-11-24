"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { useForm } from "react-hook-form";
import * as z from "zod";
import type { ShippingMethod } from "./use-shipping";

const shippingFormSchema = z.object({
	name: z.string().min(1, "Name is required"),
	code: z.string().min(1, "Code is required"),
	description: z.string().optional(),
	basePrice: z.string().min(1, "Base price is required"),
	currency: z.string().min(3, "Currency code is required").max(3),
	minOrderAmount: z.string().optional(),
	maxOrderAmount: z.string().optional(),
	freeShippingThreshold: z.string().optional(),
	estimatedMinDays: z.string().optional(),
	estimatedMaxDays: z.string().optional(),
	carrier: z.string().optional(),
	trackingUrl: z.string().optional(),
	isActive: z.boolean().optional(),
	isDefault: z.boolean().optional(),
});

type ShippingFormValues = z.infer<typeof shippingFormSchema>;

interface ShippingFormProps {
	initialData?: ShippingMethod;
	onSubmit: (data: ShippingFormValues) => Promise<void>;
	isSubmitting?: boolean;
}

export const ShippingForm = ({
	initialData,
	onSubmit,
	isSubmitting,
}: ShippingFormProps) => {
	const form = useForm<ShippingFormValues>({
		resolver: zodResolver(shippingFormSchema),
		defaultValues: {
			name: initialData?.name || "",
			code: initialData?.code || "",
			description: initialData?.description || "",
			basePrice: initialData?.basePrice || "0",
			currency: initialData?.currency || "USD",
			minOrderAmount: initialData?.minOrderAmount || "",
			maxOrderAmount: initialData?.maxOrderAmount || "",
			freeShippingThreshold: initialData?.freeShippingThreshold || "",
			estimatedMinDays: initialData?.estimatedMinDays || "",
			estimatedMaxDays: initialData?.estimatedMaxDays || "",
			carrier: initialData?.carrier || "",
			trackingUrl: initialData?.trackingUrl || "",
			isActive: initialData?.isActive ?? true,
			isDefault: initialData?.isDefault ?? false,
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<div className="grid gap-8">
					{/* General Information */}
					<Card>
						<CardHeader>
							<CardTitle>General Information</CardTitle>
							<CardDescription>
								Basic details about the shipping method.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-4">
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Name</FormLabel>
											<FormControl>
												<Input placeholder="Standard Shipping" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="code"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Code</FormLabel>
											<FormControl>
												<Input placeholder="STD-SHIP" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Standard shipping via ground transport"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					{/* Pricing & Conditions */}
					<Card>
						<CardHeader>
							<CardTitle>Pricing & Conditions</CardTitle>
							<CardDescription>
								Set the pricing and order requirements for this method.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-4">
							<div className="grid gap-4 md:grid-cols-3">
								<FormField
									control={form.control}
									name="basePrice"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Base Price</FormLabel>
											<FormControl>
												<Input type="number" step="0.01" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="currency"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Currency</FormLabel>
											<FormControl>
												<Input placeholder="USD" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="freeShippingThreshold"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Free Shipping Threshold</FormLabel>
											<FormControl>
												<Input type="number" step="0.01" {...field} />
											</FormControl>
											<FormDescription>
												Order amount to qualify for free shipping
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="minOrderAmount"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Min Order Amount</FormLabel>
											<FormControl>
												<Input type="number" step="0.01" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="maxOrderAmount"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Max Order Amount</FormLabel>
											<FormControl>
												<Input type="number" step="0.01" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Delivery Details */}
					<Card>
						<CardHeader>
							<CardTitle>Delivery Details</CardTitle>
							<CardDescription>
								Estimated delivery times and carrier information.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-4">
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="estimatedMinDays"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Est. Min Days</FormLabel>
											<FormControl>
												<Input placeholder="3" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="estimatedMaxDays"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Est. Max Days</FormLabel>
											<FormControl>
												<Input placeholder="5" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="carrier"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Carrier</FormLabel>
											<FormControl>
												<Input placeholder="UPS" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="trackingUrl"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Tracking URL Template</FormLabel>
											<FormControl>
												<Input
													placeholder="https://example.com/track?id={tracking_number}"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Settings */}
					<Card>
						<CardHeader>
							<CardTitle>Settings</CardTitle>
							<CardDescription>
								Configure visibility and default status.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="isActive"
								render={({ field }) => (
									<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
										<div className="space-y-0.5">
											<FormLabel className="text-base">Active</FormLabel>
											<FormDescription>
												Enable or disable this shipping method
											</FormDescription>
										</div>
										<FormControl>
											<Switch
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="isDefault"
								render={({ field }) => (
									<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
										<div className="space-y-0.5">
											<FormLabel className="text-base">Default</FormLabel>
											<FormDescription>
												Set as default shipping method
											</FormDescription>
										</div>
										<FormControl>
											<Switch
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>
				</div>

				<div className="flex justify-end">
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? "Saving..." : "Save Shipping Method"}
					</Button>
				</div>
			</form>
		</Form>
	);
};
