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
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { hc } from "@/lib/api-client";

const formSchema = z.object({
	name: z.string().min(1, "Name is required"),
	slug: z.string().min(1, "Slug is required"),
	minPoints: z.string().refine((val) => {
		const num = Number(val);
		return !Number.isNaN(num) && num >= 0;
	}, "Must be a positive number"),
	multiplier: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid number"),
	description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TierFormProps {
	programId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	// biome-ignore lint/suspicious/noExplicitAny: <>
	initialData?: any;
}

export const TierForm = ({
	programId,
	open,
	onOpenChange,
	initialData,
}: TierFormProps) => {
	const queryClient = useQueryClient();
	const isEditing = !!initialData;

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			slug: "",
			minPoints: "0",
			multiplier: "1.00",
			description: "",
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({
				name: initialData?.name || "",
				slug: initialData?.slug || "",
				minPoints: String(initialData?.minPoints || 0),
				multiplier: initialData?.multiplier || "1.00",
				description: initialData?.description || "",
			});
		}
	}, [open, initialData, form]);

	const onSubmit = async (values: FormValues) => {
		try {
			const data = {
				name: values.name,
				slug: values.slug,
				minPoints: Number(values.minPoints),
				multiplier: values.multiplier,
				description: values.description,
				bonusProgramId: programId,
			};

			if (isEditing && initialData?.id) {
				await hc.api.store.tiers[":id"].$patch({
					param: { id: initialData.id },
					json: data,
				});
				toast.success("Tier updated successfully");
			} else {
				await hc.api.store.tiers.$post({
					json: data,
				});
				toast.success("Tier created successfully");
			}

			queryClient.invalidateQueries({ queryKey: ["bonus-tiers", programId] });
			onOpenChange(false);
		} catch (error) {
			console.error(error);
			toast.error("Something went wrong. Please try again.");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{isEditing ? "Edit Tier" : "Create Tier"}</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Update the details of this loyalty tier."
							: "Add a new tier to your loyalty program."}
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
										<Input placeholder="e.g. Gold" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="slug"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Slug</FormLabel>
									<FormControl>
										<Input placeholder="e.g. gold-tier" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="minPoints"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Min Points</FormLabel>
										<FormControl>
											<Input type="number" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="multiplier"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Multiplier</FormLabel>
										<FormControl>
											<Input type="number" step="0.01" {...field} />
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
										<Textarea placeholder="Tier description..." {...field} />
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
								{isEditing ? "Save Changes" : "Create Tier"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
