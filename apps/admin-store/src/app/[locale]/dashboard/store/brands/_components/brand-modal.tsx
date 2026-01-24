"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
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
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { BrandFormData } from "../hooks";
import { useCreateBrand, useUpdateBrand } from "../hooks";

const brandSchema = z.object({
	name: z.string().min(1, "Name is required"),
	companyName: z.string().optional(),
	logo: z.string().optional(),
	website: z.string().url("Invalid URL").optional().or(z.literal("")),
	description: z.string().optional(),
	isActive: z.boolean().optional(),
});

interface BrandModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	// biome-ignore lint/suspicious/noExplicitAny: <>
	editingBrand?: any;
	onClose: () => void;
}

export const BrandModal = ({
	open,
	onOpenChange,
	editingBrand,
	onClose,
}: BrandModalProps) => {
	const form = useForm<BrandFormData>({
		resolver: zodResolver(brandSchema),
		defaultValues: {
			name: "",
			companyName: "",
			logo: "",
			website: "",
			description: "",
			isActive: true,
		},
	});

	const isEditing = !!editingBrand;
	const createBrand = useCreateBrand();
	const updateBrand = useUpdateBrand();

	useEffect(() => {
		if (editingBrand) {
			form.reset({
				name: editingBrand.name || "",
				companyName: editingBrand.companyName || "",
				logo: editingBrand.logo || "",
				website: editingBrand.website || "",
				description: editingBrand.description || "",
				isActive: editingBrand.isActive ?? true,
			});
		} else {
			form.reset({
				name: "",
				companyName: "",
				logo: "",
				website: "",
				description: "",
				isActive: true,
			});
		}
	}, [editingBrand, form]);

	const handleSubmit = (data: BrandFormData) => {
		if (isEditing && editingBrand?.id) {
			updateBrand.mutate(
				{ data, brandId: editingBrand.id },
				{
					onSuccess: () => {
						handleClose();
					},
				},
			);
		} else {
			createBrand.mutate(data, {
				onSuccess: () => {
					handleClose();
				},
			});
		}
	};

	const handleClose = () => {
		form.reset();
		onClose();
		onOpenChange(false);
	};

	const isLoading = createBrand.isPending || updateBrand.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Edit Brand" : "Add New Brand"}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Update the brand information below."
							: "Fill in the details to create a new brand."}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-4"
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name *</FormLabel>
									<FormControl>
										<Input {...field} placeholder="Brand name" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="companyName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Company Name</FormLabel>
									<FormControl>
										<Input {...field} placeholder="Company name" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="website"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Website</FormLabel>
									<FormControl>
										<Input
											{...field}
											type="url"
											placeholder="https://example.com"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="logo"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Logo URL</FormLabel>
									<FormControl>
										<Input {...field} placeholder="Logo image URL" />
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
											{...field}
											placeholder="Brand description"
											rows={3}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="isActive"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>Active</FormLabel>
									</div>
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={handleClose}
								disabled={isLoading}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading ? "Saving..." : isEditing ? "Update" : "Create"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
