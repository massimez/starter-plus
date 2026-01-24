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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
	useActiveOrganization,
	useGetLocations,
} from "@/app/[locale]/dashboard/organization/queries";
import { useSuppliers } from "../../suppliers/hooks";
import { useCreateTransaction } from "../hooks/use-create-transaction";

const transactionSchema = z.object({
	quantityChange: z.number().int("Quantity must be a whole number"),
	reason: z.string().min(1, "Reason is required"),
	locationId: z.string().min(1, "Location is required"),
	supplierId: z.string().optional(),
	batchId: z.string().optional(),
	unitCost: z.number().optional(),
	referenceId: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	productVariantId?: string | null;
	onClose: () => void;
}

const transactionReasons = [
	"purchase",
	"sale",
	"return",
	"adjustment",
	"transfer_in",
	"transfer_out",
];

export const TransactionModal = ({
	open,
	onOpenChange,
	productVariantId,
	onClose,
}: TransactionModalProps) => {
	const { activeOrganization } = useActiveOrganization();
	const { data: locations } = useGetLocations(activeOrganization?.id);
	const { data: suppliersQueryResult } = useSuppliers();

	const form = useForm<TransactionFormData>({
		resolver: zodResolver(transactionSchema),
		defaultValues: {
			quantityChange: 0,
			reason: "",
			locationId:
				locations?.data && locations.data.length > 0
					? locations.data.find((location) => location.isDefault)?.id ||
						locations.data[0]?.id
					: "",
			supplierId: undefined,
			batchId: undefined,
			unitCost: undefined,
			referenceId: undefined,
		},
	});

	const queryClient = useQueryClient();
	const createTransaction = useCreateTransaction();

	const handleSubmit = (data: TransactionFormData) => {
		if (!productVariantId) return;

		const transactionData = {
			...data,
			supplierId: data.supplierId === "__none__" ? undefined : data.supplierId,
			batchId: data.batchId || undefined,
			referenceId: data.referenceId || undefined,
			productVariantId,
		};

		createTransaction.mutate(transactionData, {
			onSuccess: () => {
				// Invalidate queries to refresh inventory data
				queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
				handleClose();
			},
		});
	};

	const handleClose = () => {
		form.reset();
		onClose();
		onOpenChange(false);
	};

	const isLoading = createTransaction.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add Stock Transaction</DialogTitle>
					<DialogDescription>
						Create a stock transaction to track inventory changes.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-4"
					>
						<FormField
							control={form.control}
							name="quantityChange"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Quantity Change *</FormLabel>
									<FormControl>
										<Input
											{...field}
											type="number"
											placeholder="e.g. 50 or -10"
											onChange={(e) => field.onChange(Number(e.target.value))}
											value={field.value || ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="reason"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Reason *</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select reason" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{transactionReasons.map((reason) => (
												<SelectItem key={reason} value={reason}>
													{reason.replace("_", " ")}
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
											{locations?.data?.map((location) => (
												<SelectItem key={location.id} value={location.id}>
													{location.name}
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
							name="supplierId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Supplier</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a supplier (optional)" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="__none__">None</SelectItem>
											{suppliersQueryResult?.data.map((supplier) => (
												<SelectItem key={supplier.id} value={supplier.id}>
													{supplier.name}
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
							name="unitCost"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Unit Cost</FormLabel>
									<FormControl>
										<Input
											{...field}
											type="number"
											step="0.01"
											placeholder="0.00"
											onChange={(e) =>
												field.onChange(Number(e.target.value) || 0)
											}
											value={field.value || ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="referenceId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Reference ID</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder="Optional reference (order, purchase, etc.)"
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
								onClick={handleClose}
								disabled={isLoading}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading ? "Creating..." : "Create Transaction"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
