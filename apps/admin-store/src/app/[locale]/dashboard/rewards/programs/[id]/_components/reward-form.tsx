"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { hc } from "@/lib/api-client";

const formSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	type: z.enum([
		"percentage_discount",
		"fixed_discount",
		"free_shipping",
		"free_product",
		"cash_back",
	]),
	pointsCost: z.string().min(1).regex(/^\d+$/, "Must be a positive integer"),
	cashAmount: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/, "Invalid number")
		.optional()
		.or(z.literal("")),
	discountPercentage: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/, "Invalid number")
		.optional()
		.or(z.literal("")),
	discountAmount: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/, "Invalid number")
		.optional()
		.or(z.literal("")),
	minOrderAmount: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/, "Invalid number")
		.optional()
		.or(z.literal("")),
	maxRedemptionsPerUser: z
		.string()
		.optional()
		.refine(
			(val) => !val || /^\d+$/.test(val),
			"Must be a valid non-negative integer or empty",
		),
	totalRedemptionsLimit: z
		.string()
		.optional()
		.refine(
			(val) => !val || /^\d+$/.test(val),
			"Must be a valid non-negative integer or empty",
		),
});

type FormValues = z.infer<typeof formSchema>;

interface RewardFormProps {
	programId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	// biome-ignore lint/suspicious/noExplicitAny: <>
	initialData?: any;
}

export const RewardForm = ({
	programId,
	open,
	onOpenChange,
	initialData,
}: RewardFormProps) => {
	const queryClient = useQueryClient();
	const isEditing = !!initialData;

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			description: "",
			type: "percentage_discount",
			pointsCost: "100",
			cashAmount: "",
			discountPercentage: "",
			discountAmount: "",
			minOrderAmount: "",
			maxRedemptionsPerUser: "",
			totalRedemptionsLimit: "",
		},
	});

	const rewardType = form.watch("type");

	useEffect(() => {
		if (open) {
			form.reset({
				name: initialData?.name || "",
				description: initialData?.description || "",
				type: initialData?.type || "percentage_discount",
				pointsCost: String(initialData?.pointsCost || 100),
				cashAmount: initialData?.cashAmount || "",
				discountPercentage: initialData?.discountPercentage || "",
				discountAmount: initialData?.discountAmount || "",
				minOrderAmount: initialData?.minOrderAmount || "",
				maxRedemptionsPerUser: String(initialData?.maxRedemptionsPerUser || ""),
				totalRedemptionsLimit: String(initialData?.totalRedemptionsLimit || ""),
			});
		}
	}, [open, initialData, form]);

	const onSubmit = async (values: FormValues) => {
		try {
			// Clean up empty strings to undefined/null for optional fields if needed,
			// or let the API handle it if it expects strings.
			// The schema expects optional strings or undefined.
			const data = {
				name: values.name,
				description: values.description,
				type: values.type,
				pointsCost: Number(values.pointsCost),
				cashAmount: values.cashAmount || undefined,
				discountPercentage: values.discountPercentage || undefined,
				discountAmount: values.discountAmount || undefined,
				minOrderAmount: values.minOrderAmount || undefined,
				maxRedemptionsPerUser: values.maxRedemptionsPerUser
					? Number(values.maxRedemptionsPerUser)
					: undefined,
				totalRedemptionsLimit: values.totalRedemptionsLimit
					? Number(values.totalRedemptionsLimit)
					: undefined,
				bonusProgramId: programId,
			};

			if (isEditing && initialData?.id) {
				await hc.api.store.rewards[":id"].$patch({
					param: { id: initialData.id },
					json: data,
				});
				toast.success("Reward updated successfully");
			} else {
				await hc.api.store.rewards.$post({
					json: data,
				});
				toast.success("Reward created successfully");
			}

			queryClient.invalidateQueries({ queryKey: ["rewards", programId] });
			onOpenChange(false);
		} catch (error) {
			console.error(error);
			toast.error("Something went wrong. Please try again.");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Edit Reward" : "Create Reward"}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Update the details of this reward."
							: "Add a new reward for your customers."}
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input placeholder="e.g. 10% Off Next Order" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Type</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a reward type" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="percentage_discount">
													Percentage Discount
												</SelectItem>
												<SelectItem value="fixed_discount">
													Fixed Discount
												</SelectItem>
												<SelectItem value="free_shipping">
													Free Shipping
												</SelectItem>
												<SelectItem value="free_product">
													Free Product
												</SelectItem>
												<SelectItem value="cash_back">Cash Back</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="pointsCost"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Points Cost</FormLabel>
										<FormControl>
											<Input type="number" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{rewardType === "percentage_discount" && (
							<FormField
								control={form.control}
								name="discountPercentage"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Discount Percentage (%)</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												placeholder="10"
												{...field}
												value={field.value || ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{rewardType === "fixed_discount" && (
							<FormField
								control={form.control}
								name="discountAmount"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Discount Amount ($)</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												placeholder="5.00"
												{...field}
												value={field.value || ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{rewardType === "cash_back" && (
							<FormField
								control={form.control}
								name="cashAmount"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Cash Back Amount ($)</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												placeholder="10.00"
												{...field}
												value={field.value || ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						<FormField
							control={form.control}
							name="minOrderAmount"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Minimum Order Amount ($)</FormLabel>
									<FormControl>
										<Input
											type="number"
											step="0.01"
											placeholder="0.00"
											{...field}
											value={field.value || ""}
										/>
									</FormControl>
									<FormDescription>
										Optional minimum cart value to redeem this reward.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="maxRedemptionsPerUser"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Max Per User</FormLabel>
										<FormControl>
											<Input
												type="number"
												{...field}
												value={field.value || ""}
											/>
										</FormControl>
										<FormDescription>0 for unlimited</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="totalRedemptionsLimit"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Total Limit</FormLabel>
										<FormControl>
											<Input
												type="number"
												{...field}
												value={field.value || ""}
											/>
										</FormControl>
										<FormDescription>0 for unlimited</FormDescription>
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
										<Textarea placeholder="Reward description..." {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={form.formState.isSubmitting}>
								{form.formState.isSubmitting && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								{isEditing ? "Save Changes" : "Create Reward"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
