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
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { ClientFormData } from "../hooks";
import { useCreateClient, useUpdateClient } from "../hooks";

const clientSchema = z.object({
	firstName: z.string().min(1, "First name is required").max(100).optional(),
	lastName: z.string().min(1, "Last name is required").max(100).optional(),
	email: z.string().email("Invalid email").optional().or(z.literal("")),
	phone: z.string().optional(),
	preferredContactMethod: z.enum(["email", "phone", "sms"]).optional(),
	language: z.string().optional(),
	timezone: z.string().optional(),
	notes: z.string().optional(),
	marketingConsent: z.boolean().optional(),
	gdprConsent: z.boolean().optional(),
	isActive: z.boolean().optional(),
	emailVerified: z.boolean().optional(),
	phoneVerified: z.boolean().optional(),
});

interface ClientModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	// biome-ignore lint/suspicious/noExplicitAny: <>
	editingClient?: any;
	onClose: () => void;
}

export const ClientModal = ({
	open,
	onOpenChange,
	editingClient,
	onClose,
}: ClientModalProps) => {
	const form = useForm<ClientFormData>({
		resolver: zodResolver(clientSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			phone: "",
			preferredContactMethod: undefined,
			language: "en",
			timezone: "UTC",
			notes: "",
			marketingConsent: false,
			gdprConsent: false,
			isActive: true,
			emailVerified: false,
			phoneVerified: false,
		},
	});

	const isEditing = !!editingClient;
	const createClient = useCreateClient();
	const updateClient = useUpdateClient();

	useEffect(() => {
		if (editingClient) {
			form.reset({
				firstName: editingClient.firstName || "",
				lastName: editingClient.lastName || "",
				email: editingClient.email || "",
				phone: editingClient.phone || "",
				preferredContactMethod:
					editingClient.preferredContactMethod || undefined,
				language: editingClient.language || "en",
				timezone: editingClient.timezone || "UTC",
				notes: editingClient.notes || "",
				marketingConsent: editingClient.marketingConsent ?? false,
				gdprConsent: editingClient.gdprConsent ?? false,
				isActive: editingClient.isActive ?? true,
				emailVerified: editingClient.emailVerified ?? false,
				phoneVerified: editingClient.phoneVerified ?? false,
			});
		} else {
			form.reset({
				firstName: "",
				lastName: "",
				email: "",
				phone: "",
				preferredContactMethod: undefined,
				language: "en",
				timezone: "UTC",
				notes: "",
				marketingConsent: false,
				gdprConsent: false,
				isActive: true,
				emailVerified: false,
				phoneVerified: false,
			});
		}
	}, [editingClient, form]);

	const handleSubmit = (data: ClientFormData) => {
		if (isEditing && editingClient?.id) {
			updateClient.mutate(
				{ data, clientId: editingClient.id },
				{
					onSuccess: () => {
						handleClose();
					},
				},
			);
		} else {
			createClient.mutate(data, {
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

	const isLoading = createClient.isPending || updateClient.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Edit Client" : "Add New Client"}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Update the client information below."
							: "Fill in the details to create a new client."}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-4"
					>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="firstName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>First Name *</FormLabel>
										<FormControl>
											<Input {...field} placeholder="John" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="lastName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Last Name *</FormLabel>
										<FormControl>
											<Input {...field} placeholder="Doe" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

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
											placeholder="client@example.com"
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
							name="preferredContactMethod"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Preferred Contact Method</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select contact method" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="email">Email</SelectItem>
											<SelectItem value="phone">Phone</SelectItem>
											<SelectItem value="sms">SMS</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="language"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Language</FormLabel>
										<FormControl>
											<Input {...field} placeholder="en" />
										</FormControl>
										<FormDescription>
											ISO 639-1 code (e.g., en, es, fr)
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Notes</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="Additional notes about this client..."
											rows={3}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="space-y-3">
							<FormField
								control={form.control}
								name="marketingConsent"
								render={({ field }) => (
									<FormItem className="flex flex-row items-start space-x-3 space-y-0">
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<div className="space-y-1 leading-none">
											<FormLabel>Marketing Consent</FormLabel>
											<FormDescription>
												Client has consented to receive marketing communications
											</FormDescription>
										</div>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="gdprConsent"
								render={({ field }) => (
									<FormItem className="flex flex-row items-start space-x-3 space-y-0">
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<div className="space-y-1 leading-none">
											<FormLabel>GDPR Consent</FormLabel>
											<FormDescription>
												Client has consented to GDPR terms
											</FormDescription>
										</div>
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
											<FormDescription>
												Client account is active
											</FormDescription>
										</div>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="emailVerified"
								render={({ field }) => (
									<FormItem className="flex flex-row items-start space-x-3 space-y-0">
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<div className="space-y-1 leading-none">
											<FormLabel>Email Verified</FormLabel>
											<FormDescription>
												Client email address has been verified
											</FormDescription>
										</div>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="phoneVerified"
								render={({ field }) => (
									<FormItem className="flex flex-row items-start space-x-3 space-y-0">
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<div className="space-y-1 leading-none">
											<FormLabel>Phone Verified</FormLabel>
											<FormDescription>
												Client phone number has been verified
											</FormDescription>
										</div>
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
