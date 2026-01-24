"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { SupplierFormData } from "../hooks";
import { useCreateSupplier, useUpdateSupplier } from "../hooks";

const supplierSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.email("Invalid email").optional().or(z.literal("")),
	phone: z.string().optional(),
	address: z.string().optional(),
	city: z.string().optional(),
	country: z.string().optional(),
	contactPerson: z.string().optional(),
	website: z.string().optional(),
	paymentTerms: z.string().optional(),
	leadTimeDays: z.number().optional(),
	currency: z.string().optional(),
	rating: z.number().min(0).max(5).optional(),
	isActive: z.boolean().optional(),
});

interface SupplierModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	// biome-ignore lint/suspicious/noExplicitAny: <>
	editingSupplier?: any;
	onClose: () => void;
}

export const SupplierModal = ({
	open,
	onOpenChange,
	editingSupplier,
	onClose,
}: SupplierModalProps) => {
	const form = useForm<SupplierFormData>({
		resolver: zodResolver(supplierSchema),
		defaultValues: {
			name: "",
			email: "",
			phone: "",
			address: "",
			city: "",
			country: "",
			contactPerson: "",
		},
	});

	const isEditing = !!editingSupplier;
	const createSupplier = useCreateSupplier();
	const updateSupplier = useUpdateSupplier();

	useEffect(() => {
		if (editingSupplier) {
			const addressObj = editingSupplier.address || {};
			form.reset({
				name: editingSupplier.name || "",
				email: editingSupplier.email || "",
				phone: editingSupplier.phone || "",
				address: addressObj.street || addressObj.address || "",
				city: editingSupplier.city || addressObj.city || "",
				country: editingSupplier.country || addressObj.country || "",
				contactPerson: editingSupplier.contactPerson || "",
				website: editingSupplier.website || "",
				paymentTerms: editingSupplier.paymentTerms || "",
				leadTimeDays: editingSupplier.leadTimeDays || undefined,
				currency: editingSupplier.currency || "",
				rating: editingSupplier.rating || undefined,
				isActive: editingSupplier.isActive ?? true,
			});
		} else {
			form.reset({
				name: "",
				email: "",
				phone: "",
				address: "",
				city: "",
				country: "",
				contactPerson: "",
			});
		}
	}, [editingSupplier, form]);

	const handleSubmit = (data: SupplierFormData) => {
		if (isEditing && editingSupplier?.id) {
			updateSupplier.mutate(
				{ data, supplierId: editingSupplier.id },
				{
					onSuccess: () => {
						handleClose();
					},
				},
			);
		} else {
			createSupplier.mutate(data, {
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

	const isLoading = createSupplier.isPending || updateSupplier.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Edit Supplier" : "Add New Supplier"}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Update the supplier information below."
							: "Fill in the details to create a new supplier."}
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
										<Input {...field} placeholder="Supplier name" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											{...field}
											type="email"
											placeholder="supplier@example.com"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="phone"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Phone</FormLabel>
									<FormControl>
										<Input {...field} placeholder="+1234567890" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="contactPerson"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Contact Person</FormLabel>
									<FormControl>
										<Input {...field} placeholder="Primary contact name" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="address"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Address</FormLabel>
									<FormControl>
										<Input {...field} placeholder="Street address" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="city"
								render={({ field }) => (
									<FormItem>
										<FormLabel>City</FormLabel>
										<FormControl>
											<Input {...field} placeholder="City" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="country"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Country</FormLabel>
										<FormControl>
											<Input {...field} placeholder="Country" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

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
