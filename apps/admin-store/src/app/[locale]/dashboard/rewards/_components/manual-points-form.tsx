"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { Loader2, Minus, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
	action: z.enum(["award", "deduct"]),
	points: z
		.string()
		.refine((val) => /^\d+$/.test(val) && Number.parseInt(val, 10) > 0, {
			message: "Must be a positive integer",
		}),
	description: z.string().min(1, "Description is required"),
	expiresAt: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ManualPointsFormProps {
	userId: string;
	bonusProgramId: string;
	currentPoints: number;
}

export const ManualPointsForm = ({
	userId,
	bonusProgramId,
	currentPoints,
}: ManualPointsFormProps) => {
	const queryClient = useQueryClient();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			action: "award",
			points: "",
			description: "",
			expiresAt: "",
		},
	});

	const mutation = useMutation({
		mutationFn: async (values: FormValues) => {
			const points = Number.parseInt(values.points, 10);

			if (values.action === "award") {
				const url = `/api/store/points/award?bonusProgramId=${bonusProgramId}`;
				const res = await fetch(url, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId,
						points,
						description: values.description,
						expiresAt: values.expiresAt || undefined,
					}),
				});
				return await res.json();
			}
			const url = `/api/store/points/deduct?bonusProgramId=${bonusProgramId}`;
			const res = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId,
					points,
					description: values.description,
				}),
			});
			return await res.json();
		},
		onSuccess: (_data, variables) => {
			toast.success(
				`Points ${variables.action === "award" ? "awarded" : "deducted"} successfully`,
			);
			queryClient.invalidateQueries({ queryKey: ["points-balance", userId] });
			queryClient.invalidateQueries({
				queryKey: ["transaction-history", userId],
			});
			form.reset();
		},
		onError: (error: Error) => {
			console.error(error);
			toast.error(error.message || "Failed to adjust points");
		},
	});

	const onSubmit = async (values: FormValues) => {
		// Validate sufficient points for deduction
		if (values.action === "deduct") {
			const points = Number.parseInt(values.points, 10);
			if (points > currentPoints) {
				toast.error(
					`Insufficient points. User has ${currentPoints} points available.`,
				);
				return;
			}

			// Confirm large deductions
			if (points > 1000) {
				if (
					!confirm(
						`Are you sure you want to deduct ${points} points from this user?`,
					)
				) {
					return;
				}
			}
		}

		mutation.mutate(values);
	};

	const action = form.watch("action");

	return (
		<Card>
			<CardHeader>
				<CardTitle>Manual Points Adjustment</CardTitle>
				<CardDescription>
					Award or deduct points for this user. This action will be recorded in
					the transaction history.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<FormField
							control={form.control}
							name="action"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Action</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select action" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="award">
												<div className="flex items-center gap-2">
													<Plus className="h-4 w-4 text-green-600" />
													<span>Award Points</span>
												</div>
											</SelectItem>
											<SelectItem value="deduct">
												<div className="flex items-center gap-2">
													<Minus className="h-4 w-4 text-red-600" />
													<span>Deduct Points</span>
												</div>
											</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="points"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Points Amount</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="Enter points amount"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										{action === "deduct" &&
											`User currently has ${currentPoints.toLocaleString()} points available`}
									</FormDescription>
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
											placeholder="Reason for adjustment..."
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Explain why you are adjusting the points
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{action === "award" && (
							<FormField
								control={form.control}
								name="expiresAt"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Expiration Date (Optional)</FormLabel>
										<FormControl>
											<Input type="datetime-local" {...field} />
										</FormControl>
										<FormDescription>
											Leave empty for points that never expire
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						<Button
							type="submit"
							disabled={mutation.isPending}
							className="w-full"
						>
							{mutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{action === "award" ? "Award Points" : "Deduct Points"}
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
};
