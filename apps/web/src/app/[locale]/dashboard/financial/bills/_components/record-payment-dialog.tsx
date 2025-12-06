"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useRecordPayment } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-bills";

const formSchema = z.object({
	amount: z.string().min(1, "Amount is required"),
	paymentDate: z.string().min(1, "Payment date is required"),
	paymentMethod: z.enum(["bank_transfer", "check", "cash", "card"]),
	referenceNumber: z.string().optional(),
});

interface RecordPaymentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	bill: {
		id: string;
		supplierId: string;
		invoiceNumber: string;
		totalAmount: string;
		netAmount: string; // This is actually remaining amount in some contexts or equal to total if no tax/discount logic, but let's assume we want to pay the full remaining.
		paymentStatus: "unpaid" | "partially_paid" | "paid";
	};
}

export function RecordPaymentDialog({
	open,
	onOpenChange,
	bill,
}: RecordPaymentDialogProps) {
	const recordPayment = useRecordPayment();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			amount: bill.netAmount, // Default to full amount. Ideally specific logic for remaining balance.
			paymentDate: new Date().toISOString().split("T")[0],
			paymentMethod: "bank_transfer",
			referenceNumber: "",
		},
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		recordPayment.mutate(
			{
				supplierId: bill.supplierId,
				amount: Number(values.amount),
				paymentDate: new Date(values.paymentDate),
				paymentMethod: values.paymentMethod,
				referenceNumber: values.referenceNumber,
				allocations: [
					{
						invoiceId: bill.id,
						amount: Number(values.amount),
					},
				],
			},
			{
				onSuccess: () => {
					toast.success("Payment recorded successfully");
					onOpenChange(false);
					form.reset();
				},
				onError: (error) => {
					toast.error(error.message);
				},
			},
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Record Payment</DialogTitle>
					<DialogDescription>
						Record a payment for bill #{bill.invoiceNumber}
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="amount"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Payment Amount</FormLabel>
									<FormControl>
										<div className="relative">
											<span className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground">
												$
											</span>
											<Input
												type="number"
												step="0.01"
												className="pl-7"
												{...field}
											/>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="paymentDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Payment Date</FormLabel>
									<FormControl>
										<Input type="date" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="paymentMethod"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Payment Method</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select method" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="bank_transfer">
												Bank Transfer
											</SelectItem>
											<SelectItem value="check">Check</SelectItem>
											<SelectItem value="cash">Cash</SelectItem>
											<SelectItem value="card">Credit Card</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="referenceNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Reference Number</FormLabel>
									<FormControl>
										<Input placeholder="e.g. Check #" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex justify-end gap-2 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={recordPayment.isPending}>
								{recordPayment.isPending ? "Recording..." : "Record Payment"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
