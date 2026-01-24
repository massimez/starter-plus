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
import { Switch } from "@workspace/ui/components/switch";
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
		"first_purchase",
		"total_spent",
		"order_count",
		"product_review",
		"referral_count",
		"custom",
	]),
	targetValue: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/, "Must be a valid positive number"),
	rewardPoints: z.string().min(1).regex(/^\d+$/, "Must be a positive integer"),
	isRepeatable: z.boolean(),
	sortOrder: z
		.string()
		.optional()
		.refine((val) => !val || /^\d+$/.test(val), "Must be a valid integer"),
});

type FormValues = z.infer<typeof formSchema>;

interface Milestone {
	id: string;
	name: string;
	description?: string | null;
	type:
		| "first_purchase"
		| "total_spent"
		| "order_count"
		| "product_review"
		| "referral_count"
		| "custom";
	targetValue: string;
	rewardPoints: number;
	isRepeatable: boolean | null;
	sortOrder: number | null;
}

interface MilestoneFormProps {
	programId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialData?: Milestone | null;
}

export const MilestoneForm = ({
	programId,
	open,
	onOpenChange,
	initialData,
}: MilestoneFormProps) => {
	const queryClient = useQueryClient();
	const isEditing = !!initialData;

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			description: "",
			type: "total_spent",
			targetValue: "",
			rewardPoints: "",
			isRepeatable: false,
			sortOrder: "0",
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({
				name: initialData?.name || "",
				description: initialData?.description || "",
				type: initialData?.type || "total_spent",
				targetValue: initialData?.targetValue || "",
				rewardPoints: String(initialData?.rewardPoints || ""),
				isRepeatable: initialData?.isRepeatable || false,
				sortOrder: String(initialData?.sortOrder || "0"),
			});
		}
	}, [open, initialData, form]);

	const onSubmit = async (values: FormValues) => {
		try {
			const data = {
				name: values.name,
				description: values.description,
				type: values.type,
				targetValue: values.targetValue,
				rewardPoints: Number(values.rewardPoints),
				isRepeatable: values.isRepeatable,
				sortOrder: values.sortOrder ? Number(values.sortOrder) : 0,
				bonusProgramId: programId,
			};

			if (isEditing && initialData?.id) {
				await hc.api.store.milestones[":id"].$patch({
					param: { id: initialData.id },
					json: data,
				});
				toast.success("Milestone updated successfully");
			} else {
				await hc.api.store.milestones.$post({
					json: data,
				});
				toast.success("Milestone created successfully");
			}

			queryClient.invalidateQueries({ queryKey: ["milestones", programId] });
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
						{isEditing ? "Edit Milestone" : "Create Milestone"}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Update the details of this milestone."
							: "Add a new milestone for your customers to achieve."}
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
										<Input placeholder="e.g. Big Spender" {...field} />
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
													<SelectValue placeholder="Select a milestone type" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="first_purchase">
													First Purchase
												</SelectItem>
												<SelectItem value="total_spent">Total Spent</SelectItem>
												<SelectItem value="order_count">Order Count</SelectItem>
												<SelectItem value="product_review">
													Product Review
												</SelectItem>
												<SelectItem value="referral_count">
													Referral Count
												</SelectItem>
												<SelectItem value="custom">Custom</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="sortOrder"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Sort Order</FormLabel>
										<FormControl>
											<Input type="number" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="targetValue"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Target Value</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												placeholder="100.00"
												{...field}
											/>
										</FormControl>
										<FormDescription>
											Value to reach (e.g. $100 spent)
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="rewardPoints"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Reward Points</FormLabel>
										<FormControl>
											<Input type="number" placeholder="500" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="isRepeatable"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">Repeatable</FormLabel>
										<FormDescription>
											Can this milestone be achieved multiple times?
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
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Milestone description..."
											{...field}
										/>
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
								{isEditing ? "Save Changes" : "Create Milestone"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
