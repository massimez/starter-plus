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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useGetLocations } from "@/app/[lang]/dashboard/organization/queries";
import { authClient } from "@/lib/auth-client";
import { useCreateBatch } from "../hooks/use-batches";
import { useInventory } from "../hooks/use-inventory";

// -------------------------------
// 🧩 Schema & Types
// -------------------------------
const batchSchema = z.object({
	organizationId: z.string("Invalid organization ID"),
	productVariantId: z.string().min(1, "Product variant is required"),
	batchNumber: z.string().min(1, "Batch number is required"),
	expiryDate: z.string().optional(),
	locationId: z.string().min(1, "Location is required"),
	quantity: z.number().min(1, "Quantity must be at least 1"),
});

type BatchFormData = z.infer<typeof batchSchema>;

interface BatchModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onClose: () => void;
	selectedVariantId: string;
}

// -------------------------------
// 🧱 Types for inventory data
// -------------------------------
interface Product {
	id: string;
	name: string;
}

interface Variant {
	id: string;
	sku: string;
}

interface InventoryItem {
	product: Product;
	variants: Variant[];
}

// -------------------------------
// 🎯 Component
// -------------------------------
export const BatchModal = ({
	open,
	onOpenChange,
	onClose,
	selectedVariantId,
}: BatchModalProps) => {
	const { data: inventoryResult, isLoading: inventoryLoading } = useInventory();
	const createBatch = useCreateBatch();
	const activeOrg = authClient.useActiveOrganization();
	const organizationId = activeOrg.data?.id || "";
	const { data: locations, isLoading: locationsLoading } =
		useGetLocations(organizationId);

	// Memoize flattened variants for performance
	const flattenedInventory = useMemo(() => {
		const items = inventoryResult?.data ?? [];
		return items.flatMap((item) =>
			item.variants.map((variant) => ({
				productId: item.id,
				productName: item.name || "Unnamed Product",
				productVariantId: variant.id,
				variantSku: variant.sku || "No SKU",
			})),
		);
	}, [inventoryResult?.data]);

	const form = useForm<BatchFormData>({
		resolver: zodResolver(batchSchema),
		defaultValues: {
			organizationId: organizationId,
			productVariantId: selectedVariantId || "",
			batchNumber: "",
			expiryDate: "",
			locationId: "",
			quantity: 1,
		},
	});

	const handleClose = () => {
		form.reset();
		onClose();
		onOpenChange(false);
	};

	const handleSubmit = (data: BatchFormData) => {
		createBatch.mutate(
			{
				...data,
				expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
			} as any,
			{
				onSuccess: () => {
					toast.success("Batch created successfully");
					handleClose();
				},
				onError: (err: any) => {
					toast.error(err?.message || "Failed to create batch");
				},
			},
		);
	};

	const isSubmitting = createBatch.isPending;
	console.log(form.formState);

	// ---------------------------------------
	// 🔧 UI
	// ---------------------------------------
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add New Batch</DialogTitle>
					<DialogDescription>
						Create a new batch for stock management.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-4"
					>
						{/* Selected Variant Display */}
						{selectedVariantId && (
							<div className="rounded-lg border bg-slate-50 p-4 dark:bg-slate-800/50">
								<div className="mb-2 flex items-center gap-2">
									<h3 className="font-semibold text-slate-700 text-sm dark:text-slate-300">
										Selected Variant
									</h3>
									<span className="rounded border bg-white px-2 py-1 text-slate-500 text-xs">
										Pre-selected for this batch
									</span>
								</div>
								{(() => {
									const selected = flattenedInventory.find(
										(v) => v.productVariantId === selectedVariantId,
									);
									return selected ? (
										<div className="space-y-1">
											<p className="font-medium text-sm">
												{selected.productName}
											</p>
											<p className="text-slate-600 text-xs dark:text-slate-400">
												SKU: {selected.variantSku}
											</p>
										</div>
									) : (
										<p className="text-red-500 text-xs">
											Variant not found in inventory
										</p>
									);
								})()}
							</div>
						)}

						{/* Batch Number */}
						<FormField
							control={form.control}
							name="batchNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Batch Number *</FormLabel>
									<FormControl>
										<Input {...field} placeholder="e.g. BATCH-001" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						{/* Quantity */}
						<FormField
							control={form.control}
							name="quantity"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Quantity *</FormLabel>
									<FormControl>
										<Input
											type="number"
											min={1}
											step={1}
											placeholder="Enter quantity"
											{...field}
											onChange={(e) => field.onChange(Number(e.target.value))}
											value={field.value}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						{/* Location */}
						<FormField
							control={form.control}
							name="locationId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Location *</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a location" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{locationsLoading ? (
												<SelectItem value="loading" disabled>
													Loading locations...
												</SelectItem>
											) : locations && "data" in locations && locations.data ? (
												locations.data.map((location: any) => (
													<SelectItem key={location.id} value={location.id}>
														{location.name}{" "}
														<span className="text-muted-foreground text-xs">
															({location.locationType})
														</span>
													</SelectItem>
												))
											) : (
												<SelectItem value="no-locations" disabled>
													No locations available
												</SelectItem>
											)}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						{/* Expiry Date */}
						<FormField
							control={form.control}
							name="expiryDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Expiry Date</FormLabel>
									<FormControl>
										<Input {...field} type="date" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						{/* Actions */}
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={handleClose}
								disabled={isSubmitting}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? "Creating..." : "Create Batch"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
