"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
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
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { hc } from "@/lib/api-client";

const formSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	pointsPerDollar: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid number"),
	minOrderAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid number"),
	signupBonus: z.string().refine((val) => /^\d+$/.test(val), {
		message: "Must be a positive integer",
	}),
	isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProgramFormProps {
	// biome-ignore lint/suspicious/noExplicitAny: <>
	initialData?: any;
	isEditing?: boolean;
}

export const ProgramForm = ({ initialData, isEditing }: ProgramFormProps) => {
	const router = useRouter();
	const queryClient = useQueryClient();

	const defaultValues: FormValues = {
		name: initialData?.name || "",
		description: initialData?.description || "",
		pointsPerDollar: initialData?.pointsPerDollar || "1.00",
		minOrderAmount: initialData?.minOrderAmount || "0.00",
		signupBonus:
			initialData?.signupBonus != null ? String(initialData.signupBonus) : "0",
		isActive: initialData?.isActive ?? true,
	};

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues,
	});

	const onSubmit = async (values: FormValues) => {
		try {
			const data = {
				...values,
				signupBonus: Number(values.signupBonus),
			};

			if (isEditing && initialData?.id) {
				await hc.api.store["bonus-programs"][":id"].$patch({
					param: { id: initialData.id },
					json: data,
				});
				toast.success("Bonus program updated successfully");
			} else {
				await hc.api.store["bonus-programs"].$post({
					json: data,
				});
				toast.success("Bonus program created successfully");
			}

			queryClient.invalidateQueries({ queryKey: ["bonus-programs"] });
			router.push("/dashboard/rewards/programs");
			router.refresh();
		} catch (error) {
			console.error(error);
			toast.error("Something went wrong. Please try again.");
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{isEditing ? "Edit Bonus Program" : "Create Bonus Program"}
				</CardTitle>
				<CardDescription>
					Configure the basic settings for your loyalty program.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Program Name</FormLabel>
									<FormControl>
										<Input placeholder="e.g. VIP Rewards" {...field} />
									</FormControl>
									<FormMessage />
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
											placeholder="Describe your program..."
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							<FormField
								control={form.control}
								name="pointsPerDollar"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Points per Dollar</FormLabel>
										<FormControl>
											<Input type="number" step="0.01" {...field} />
										</FormControl>
										<FormDescription>
											How many points customers earn for every $1 spent.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="minOrderAmount"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Minimum Order Amount</FormLabel>
										<FormControl>
											<Input type="number" step="0.01" {...field} />
										</FormControl>
										<FormDescription>
											Minimum purchase amount required to earn points.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							<FormField
								control={form.control}
								name="signupBonus"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Signup Bonus</FormLabel>
										<FormControl>
											<Input type="number" {...field} />
										</FormControl>
										<FormDescription>
											Points awarded when a user joins the program.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="isActive"
								render={({ field }) => (
									<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
										<div className="space-y-0.5">
											<FormLabel className="text-base">Active Status</FormLabel>
											<FormDescription>
												Enable or disable this program.
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
						</div>

						<div className="flex justify-end gap-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => router.back()}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={form.formState.isSubmitting}>
								{form.formState.isSubmitting && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								{isEditing ? "Update Program" : "Create Program"}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
};
