"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@workspace/ui/components/badge";
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
import { Separator } from "@workspace/ui/components/separator";
import { Textarea } from "@workspace/ui/components/textarea";
import {
	Calendar,
	FileText,
	Loader2,
	Mail,
	Package,
	Phone,
	Save,
	Truck,
	User,
	X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { hc } from "@/lib/api-client";
import { OrderStatusHistory } from "./order-status-history";
import type { Order } from "./types";

const editOrderSchema = z.object({
	status: z
		.enum([
			"draft",
			"pending",
			"confirmed",
			"processing",
			"shipped",
			"delivered",
			"completed",
			"cancelled",
			"failed",
			"returned",
			"paid",
			"refunded",
		])
		.optional(),
	customerFullName: z.string().optional(),
	customerEmail: z
		.string()
		.email("Invalid email address")
		.optional()
		.or(z.literal("")),
	customerPhone: z.string().optional(),
	customerNotes: z.string().optional(),
	shippingMethod: z.string().optional(),
	trackingNumber: z.string().optional(),
	expectedShipDate: z.string().optional(),
	notes: z.string().optional(),
	tags: z.array(z.string()).optional(),
});

type EditOrderForm = z.infer<typeof editOrderSchema>;

interface EditOrderDialogProps {
	order: Order | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const STATUS_CONFIG = {
	draft: { color: "bg-gray-100 text-gray-800 border-gray-200", label: "Draft" },
	pending: {
		color: "bg-yellow-100 text-yellow-800 border-yellow-200",
		label: "Pending",
	},
	confirmed: {
		color: "bg-blue-100 text-blue-800 border-blue-200",
		label: "Confirmed",
	},
	processing: {
		color: "bg-purple-100 text-purple-800 border-purple-200",
		label: "Processing",
	},
	shipped: {
		color: "bg-indigo-100 text-indigo-800 border-indigo-200",
		label: "Shipped",
	},
	delivered: {
		color: "bg-green-100 text-green-800 border-green-200",
		label: "Delivered",
	},
	completed: {
		color: "bg-emerald-100 text-emerald-800 border-emerald-200",
		label: "Completed",
	},
	cancelled: {
		color: "bg-red-100 text-red-800 border-red-200",
		label: "Cancelled",
	},
	failed: { color: "bg-red-100 text-red-800 border-red-200", label: "Failed" },
	returned: {
		color: "bg-orange-100 text-orange-800 border-orange-200",
		label: "Returned",
	},
	paid: { color: "bg-teal-100 text-teal-800 border-teal-200", label: "Paid" },
	refunded: {
		color: "bg-pink-100 text-pink-800 border-pink-200",
		label: "Refunded",
	},
};

export const EditOrderDialog = ({
	order,
	open,
	onOpenChange,
}: EditOrderDialogProps) => {
	const queryClient = useQueryClient();

	const form = useForm<EditOrderForm>({
		resolver: zodResolver(editOrderSchema),
		values: {
			status: order?.status,
			customerFullName: order?.customerFullName || "",
			customerEmail: order?.customerEmail || "",
			customerPhone: order?.customerPhone || "",
			customerNotes: order?.customerNotes || "",
			shippingMethod: order?.shippingMethod || "",
			trackingNumber: order?.trackingNumber || "",
			expectedShipDate: order?.expectedShipDate?.toString() || "",
			notes: order?.notes || "",
			tags: order?.tags || [],
		},
	});

	const { mutate: updateOrder, isPending } = useMutation({
		mutationFn: async (data: EditOrderForm) => {
			if (!order) throw new Error("No order selected");

			// Clean up data - remove empty strings and undefined
			const cleanData = Object.fromEntries(
				Object.entries(data).filter(
					([_, value]) =>
						value !== "" &&
						value !== null &&
						value !== undefined &&
						(!Array.isArray(value) || value.length > 0),
				),
			);

			const result = await hc.api.store.orders[":id"].$patch({
				param: { id: order.id },
				json: cleanData,
			});

			return result.json();
		},
		onSuccess: () => {
			toast.success("Order updated successfully");
			queryClient.invalidateQueries({ queryKey: ["orders"] });
			queryClient.invalidateQueries({
				queryKey: ["order-status-history", order?.id],
			});
			onOpenChange(false);
		},
		onError: (error) => {
			console.error("Failed to update order:", error);
			toast.error("Failed to update order");
		},
	});

	const { data: historyData, isLoading: isLoadingHistory } = useQuery({
		queryKey: ["order-status-history", order?.id],
		queryFn: async () => {
			if (!order?.id) return [];
			const result = await hc.api.store.orders[":id"]["status-history"].$get({
				param: { id: order.id },
			});
			return result.json().then((res) => res.data);
		},
		enabled: !!order?.id && open,
	});

	const onSubmit = (data: EditOrderForm) => {
		updateOrder(data);
	};

	const selectedStatus = form.watch("status");

	if (!order) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
				<DialogHeader className="space-y-3">
					<div className="flex items-center justify-between">
						<DialogTitle className="text-xl">
							Edit Order #{order.orderNumber}
						</DialogTitle>
						{selectedStatus && (
							<Badge
								className={`${STATUS_CONFIG[selectedStatus].color} border font-medium`}
							>
								{STATUS_CONFIG[selectedStatus].label}
							</Badge>
						)}
					</div>
					<DialogDescription>
						Update order information. Only modified fields will be saved.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						{/* Order Status Section */}
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<Package className="h-4 w-4 text-muted-foreground" />
								<h3 className="font-semibold text-sm">Order Status</h3>
							</div>
							<FormField
								control={form.control}
								name="status"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Status</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger className="h-11">
													<SelectValue placeholder="Select status" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{Object.entries(STATUS_CONFIG).map(
													([value, config]) => (
														<SelectItem key={value} value={value}>
															<div className="flex items-center gap-2">
																<div
																	className={`h-2 w-2 rounded-full ${config.color.split(" ")[0]}`}
																/>
																{config.label}
															</div>
														</SelectItem>
													),
												)}
											</SelectContent>
										</Select>
										<FormDescription>
											Update the current order status
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<Separator />

						{/* Customer Information Section */}
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<User className="h-4 w-4 text-muted-foreground" />
								<h3 className="font-semibold text-sm">Customer Information</h3>
							</div>
							<FormField
								control={form.control}
								name="customerFullName"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center gap-1.5">
											<User className="h-3.5 w-3.5" />
											Full Name
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Customer full name"
												className="h-11"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="customerEmail"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center gap-1.5">
												<Mail className="h-3.5 w-3.5" />
												Email Address
											</FormLabel>
											<FormControl>
												<Input
													placeholder="customer@example.com"
													type="email"
													className="h-11"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="customerPhone"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center gap-1.5">
												<Phone className="h-3.5 w-3.5" />
												Phone Number
											</FormLabel>
											<FormControl>
												<Input
													placeholder="+1 234 567 8900"
													type="tel"
													className="h-11"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<FormField
								control={form.control}
								name="customerNotes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Customer Notes</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Special requests, preferences, or important customer information..."
												className="min-h-20 resize-none"
												{...field}
											/>
										</FormControl>
										<FormDescription>
											Private notes about the customer
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<Separator />

						{/* Shipping Information Section */}
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<Truck className="h-4 w-4 text-muted-foreground" />
								<h3 className="font-semibold text-sm">Shipping Information</h3>
							</div>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="shippingMethod"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Shipping Method</FormLabel>
											<FormControl>
												<Input
													placeholder="Standard, Express, Overnight..."
													className="h-11"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="expectedShipDate"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center gap-1.5">
												<Calendar className="h-3.5 w-3.5" />
												Expected Ship Date
											</FormLabel>
											<FormControl>
												<Input
													type="date"
													className="h-11"
													value={field.value?.split("T")[0] || ""}
													onChange={(e) => field.onChange(e.target.value)}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<FormField
								control={form.control}
								name="trackingNumber"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tracking Number</FormLabel>
										<FormControl>
											<Input
												placeholder="1Z999AA12345678900"
												className="h-11 font-mono text-sm"
												{...field}
											/>
										</FormControl>
										<FormDescription>
											Enter the carrier tracking number for shipment tracking
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<Separator />

						{/* Order Notes Section */}
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<FileText className="h-4 w-4 text-muted-foreground" />
								<h3 className="font-semibold text-sm">Internal Notes</h3>
							</div>
							<FormField
								control={form.control}
								name="notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Order Notes</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Internal notes, special handling instructions, or order-specific information..."
												className="min-h-[100px] resize-none"
												{...field}
											/>
										</FormControl>
										<FormDescription>
											These notes are only visible to staff members
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<Separator />

						{/* Order Status History */}
						<OrderStatusHistory
							orderId={order.id}
							// biome-ignore lint/suspicious/noExplicitAny: <>
							history={(historyData as any) || []}
							isLoading={isLoadingHistory}
						/>

						<DialogFooter className="gap-2 sm:gap-0">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isPending}
								className="gap-2"
							>
								<X className="h-4 w-4" />
								Cancel
							</Button>
							<Button type="submit" disabled={isPending} className="gap-2">
								{isPending ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Saving...
									</>
								) : (
									<>
										<Save className="h-4 w-4" />
										Save Changes
									</>
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
