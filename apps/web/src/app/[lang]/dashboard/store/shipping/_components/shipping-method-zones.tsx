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
import { Switch } from "@workspace/ui/components/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { Edit, Plus, Trash } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import {
	type ShippingMethodZone,
	useCreateShippingMethodZone,
	useDeleteShippingMethodZone,
	useShippingMethodZones,
	useUpdateShippingMethodZone,
} from "./use-shipping";
import { useShippingZones } from "./use-zones";

const methodZoneSchema = z.object({
	shippingZoneId: z.string().min(1, "Zone is required"),
	priceOverride: z.string().optional(),
	estimatedMinDaysOverride: z.string().optional(),
	estimatedMaxDaysOverride: z.string().optional(),
	isActive: z.boolean().optional(),
});

type MethodZoneFormValues = z.infer<typeof methodZoneSchema>;

interface ShippingMethodZonesProps {
	methodId: string;
}

export const ShippingMethodZones = ({ methodId }: ShippingMethodZonesProps) => {
	const { data: methodZones, isLoading: isLoadingMethodZones } =
		useShippingMethodZones(methodId);
	const { data: allZones } = useShippingZones();
	const createMutation = useCreateShippingMethodZone();
	const updateMutation = useUpdateShippingMethodZone();
	const deleteMutation = useDeleteShippingMethodZone();

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingZone, setEditingZone] = useState<ShippingMethodZone | null>(
		null,
	);

	const form = useForm<MethodZoneFormValues>({
		resolver: zodResolver(methodZoneSchema),
		defaultValues: {
			shippingZoneId: "",
			priceOverride: "",
			estimatedMinDaysOverride: "",
			estimatedMaxDaysOverride: "",
			isActive: true,
		},
	});

	const handleOpenDialog = (zone?: ShippingMethodZone) => {
		if (zone) {
			setEditingZone(zone);
			form.reset({
				shippingZoneId: zone.shippingZoneId,
				priceOverride: zone.priceOverride || "",
				estimatedMinDaysOverride: zone.estimatedMinDaysOverride || "",
				estimatedMaxDaysOverride: zone.estimatedMaxDaysOverride || "",
				isActive: zone.isActive,
			});
		} else {
			setEditingZone(null);
			form.reset({
				shippingZoneId: "",
				priceOverride: "",
				estimatedMinDaysOverride: "",
				estimatedMaxDaysOverride: "",
				isActive: true,
			});
		}
		setIsDialogOpen(true);
	};

	const onSubmit = async (values: MethodZoneFormValues) => {
		try {
			const payload = {
				...values,
				shippingMethodId: methodId,
				priceOverride: values.priceOverride || null,
				estimatedMinDaysOverride: values.estimatedMinDaysOverride || null,
				estimatedMaxDaysOverride: values.estimatedMaxDaysOverride || null,
				isActive: values.isActive ?? true,
			};

			if (editingZone) {
				await updateMutation.mutateAsync({
					id: editingZone.id,
					json: { ...payload, id: editingZone.id },
				});
				toast.success("Zone association updated");
			} else {
				await createMutation.mutateAsync(payload);
				toast.success("Zone associated successfully");
			}
			setIsDialogOpen(false);
		} catch (error) {
			toast.error(
				editingZone
					? "Failed to update zone association"
					: "Failed to associate zone",
			);
			console.error(error);
		}
	};

	const handleDelete = async (id: string) => {
		if (confirm("Are you sure you want to remove this zone association?")) {
			try {
				await deleteMutation.mutateAsync(id);
				toast.success("Zone association removed");
			} catch (error) {
				toast.error("Failed to remove zone association");
				console.error(error);
			}
		}
	};

	const getZoneName = (zoneId: string) => {
		return allZones?.find((z) => z.id === zoneId)?.name || zoneId;
	};

	if (isLoadingMethodZones) {
		return <div>Loading zones...</div>;
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="font-medium text-lg">Associated Zones</h3>
				<Button onClick={() => handleOpenDialog()} size="sm">
					<Plus className="mr-2 h-4 w-4" />
					Add Zone
				</Button>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Zone</TableHead>
							<TableHead>Price Override</TableHead>
							<TableHead>Est. Days Override</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{methodZones?.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center">
									No zones associated with this shipping method.
								</TableCell>
							</TableRow>
						) : (
							methodZones?.map((mz) => (
								<TableRow key={mz.id}>
									<TableCell>{getZoneName(mz.shippingZoneId)}</TableCell>
									<TableCell>
										{mz.priceOverride ? `$${mz.priceOverride}` : "-"}
									</TableCell>
									<TableCell>
										{mz.estimatedMinDaysOverride || mz.estimatedMaxDaysOverride
											? `${mz.estimatedMinDaysOverride || "?"} - ${mz.estimatedMaxDaysOverride || "?"} days`
											: "-"}
									</TableCell>
									<TableCell>{mz.isActive ? "Active" : "Inactive"}</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end gap-2">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleOpenDialog(mz)}
											>
												<Edit className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="text-destructive"
												onClick={() => handleDelete(mz.id)}
											>
												<Trash className="h-4 w-4" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingZone ? "Edit Zone Association" : "Add Zone Association"}
						</DialogTitle>
						<DialogDescription>
							Configure overrides for this zone.
						</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="shippingZoneId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Zone</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
											disabled={!!editingZone}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a zone" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{allZones?.map((zone) => (
													<SelectItem key={zone.id} value={zone.id}>
														{zone.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="priceOverride"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Price Override</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												placeholder="Optional"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="estimatedMinDaysOverride"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Min Days Override</FormLabel>
											<FormControl>
												<Input placeholder="Optional" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="estimatedMaxDaysOverride"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Max Days Override</FormLabel>
											<FormControl>
												<Input placeholder="Optional" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="isActive"
								render={({ field }) => (
									<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
										<div className="space-y-0.5">
											<FormLabel className="text-base">Active</FormLabel>
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

							<DialogFooter>
								<Button type="submit">Save</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</div>
	);
};
