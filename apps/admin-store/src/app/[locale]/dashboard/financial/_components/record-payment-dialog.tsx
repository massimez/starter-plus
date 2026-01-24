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
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useRecordPayment } from "@/app/[locale]/dashboard/financial/_hooks/use-invoices";
import { useCurrency } from "@/app/providers/currency-provider";
import { formatCurrency } from "@/lib/helpers";

const formSchema = z.object({
	amount: z.string().min(1, "Amount is required"),
	paymentDate: z.string().min(1, "Payment date is required"),
	paymentMethod: z.enum(["bank_transfer", "check", "cash", "card", "online"]),
	referenceNumber: z.string().optional(),
});

interface RecordPaymentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	type: "receivable" | "payable";
	document: {
		id: string;
		invoiceNumber: string;
		totalAmount: string;
		netAmount: string;
		// For bills logic
		// biome-ignore lint/suspicious/noExplicitAny: <>
		allocations?: any[];
		// Entity IDs
		supplierId?: string;
		customerId?: string;
	};
}

export function RecordPaymentDialog({
	open,
	onOpenChange,
	type,
	document,
}: RecordPaymentDialogProps) {
	const recordPayment = useRecordPayment();
	const { currency } = useCurrency();

	const totalPaid =
		document.allocations?.reduce(
			// biome-ignore lint/suspicious/noExplicitAny: inference issue
			(sum: number, a: any) => sum + Number(a.allocatedAmount),
			0,
		) || 0;

	// If allocations exist (partial payments mostly on bills), subtract from total.
	// Otherwise rely on netAmount or totalAmount if that logic is preferred.
	// For simplicity and safety, we calculate remaining from total - paid if allocations present.
	// If no allocations, we can default to netAmount (often same as total or remaining).
	const remainingAmount = document.allocations
		? Math.max(0, Number(document.totalAmount) - totalPaid)
		: Number(document.netAmount);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			amount: remainingAmount.toFixed(2),
			paymentDate: new Date().toISOString().split("T")[0],
			paymentMethod: "bank_transfer",
			referenceNumber: "",
		},
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		const paymentType = type === "payable" ? "sent" : "received";
		// If payable -> supplierId is required. If receivable -> customerId is required.
		const supplierId = type === "payable" ? document.supplierId : undefined;
		const customerId = type === "receivable" ? document.customerId : undefined;

		if (type === "payable" && !supplierId) {
			toast.error("Supplier ID missing");
			return;
		}
		if (type === "receivable" && !customerId) {
			toast.error("Customer ID missing");
			return;
		}

		recordPayment.mutate(
			{
				paymentType,
				supplierId, // Mutation accepts both but only uses one based on type
				customerId,
				amount: Number(values.amount),
				paymentDate: new Date(values.paymentDate),
				paymentMethod: values.paymentMethod,
				referenceNumber: values.referenceNumber,
				allocations: [
					{
						invoiceId: document.id,
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
						Record a payment for {type === "payable" ? "bill" : "invoice"} #
						{document.invoiceNumber}
						<span className="mt-1 block font-medium text-foreground">
							Amount Due: {formatCurrency(remainingAmount, currency)}
						</span>
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
											<SelectItem value="card">Card</SelectItem>
											<SelectItem value="online">Online</SelectItem>
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
