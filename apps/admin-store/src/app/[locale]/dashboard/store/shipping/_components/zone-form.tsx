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
import type { ShippingZone } from "./use-zones";

const zoneFormSchema = z.object({
	name: z.string().min(1, "Name is required"),
	code: z.string().min(1, "Code is required"),
	description: z.string().optional(),
	countries: z.string().optional(), // Comma separated for now
	states: z.string().optional(), // Comma separated list of states/regions
	cities: z.string().optional(), // Comma separated list of cities
	isActive: z.boolean().optional(),
});

type ZoneFormValues = z.infer<typeof zoneFormSchema>;

interface ZoneFormProps {
	initialData?: ShippingZone;
	onSubmit: (
		data: Omit<ZoneFormValues, "countries" | "states" | "cities"> & {
			countries: string[];
			states: string[];
			cities: string[];
		},
	) => Promise<void>;
	isSubmitting?: boolean;
}

export const ZoneForm = ({
	initialData,
	onSubmit,
	isSubmitting,
}: ZoneFormProps) => {
	const form = useForm<ZoneFormValues>({
		resolver: zodResolver(zoneFormSchema),
		defaultValues: {
			name: initialData?.name || "",
			code: initialData?.code || "",
			description: initialData?.description || "",
			countries: initialData?.countries?.join(", ") || "",
			states: initialData?.states?.join(", ") || "",
			cities: initialData?.cities?.join(", ") || "",
			isActive: initialData?.isActive ?? true,
		},
	});

	const handleSubmit = (values: ZoneFormValues) => {
		const formattedData = {
			...values,
			countries: values.countries
				? values.countries.split(",").map((c) => c.trim())
				: [],
			states: values.states
				? values.states.split(",").map((s) => s.trim())
				: [],
			cities: values.cities
				? values.cities.split(",").map((c) => c.trim())
				: [],
		};
		onSubmit(formattedData);
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
				<div className="grid gap-8">
					{/* Zone Details */}
					<Card>
						<CardHeader>
							<CardTitle>Zone Details</CardTitle>
							<CardDescription>
								Basic information about the shipping zone.
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
												<Input placeholder="North America" {...field} />
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
												<Input placeholder="NA-ZONE" {...field} />
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
												placeholder="Shipping zone for NA region"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					{/* Regions */}
					<Card>
						<CardHeader>
							<CardTitle>Regions</CardTitle>
							<CardDescription>
								Define which countries, states, and cities belong to this zone.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-4">
							{/* Countries */}
							<FormField
								control={form.control}
								name="countries"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Countries (ISO Codes)</FormLabel>
										<FormControl>
											<Input placeholder="US, CA, MX" {...field} />
										</FormControl>
										<FormDescription>
											Comma-separated list of ISO country codes
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* States */}
							<FormField
								control={form.control}
								name="states"
								render={({ field }) => (
									<FormItem>
										<FormLabel>States / Regions</FormLabel>
										<FormControl>
											<Input placeholder="CA, TX, NY" {...field} />
										</FormControl>
										<FormDescription>
											Comma-separated list of state or region codes/names
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Cities */}
							<FormField
								control={form.control}
								name="cities"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Cities</FormLabel>
										<FormControl>
											<Input
												placeholder="Los Angeles, New York, Chicago"
												{...field}
											/>
										</FormControl>
										<FormDescription>
											Comma-separated list of city names
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					{/* Status */}
					<Card>
						<CardHeader>
							<CardTitle>Status</CardTitle>
							<CardDescription>
								Enable or disable this shipping zone.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<FormField
								control={form.control}
								name="isActive"
								render={({ field }) => (
									<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
										<div className="space-y-0.5">
											<FormLabel className="text-base">Active</FormLabel>
											<FormDescription>
												Enable or disable this shipping zone
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
						{isSubmitting ? "Saving..." : "Save Shipping Zone"}
					</Button>
				</div>
			</form>
		</Form>
	);
};
