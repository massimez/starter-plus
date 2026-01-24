"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
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
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@workspace/ui/components/sheet";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { useFinancialPayroll } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-payroll";

const formSchema = z.object({
	periodStart: z.string().min(1, "Start date is required"),
	periodEnd: z.string().min(1, "End date is required"),
	paymentDate: z.string().min(1, "Payment date is required"),
});

export function CreatePayrollRunSheet() {
	const [open, setOpen] = useState(false);
	const { useCreatePayrollRun } = useFinancialPayroll();
	const createPayrollRun = useCreatePayrollRun();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			periodStart: new Date(
				new Date().getFullYear(),
				new Date().getMonth(),
				1,
				12, // Noon to avoid timezone issues when converting to YYYY-MM-DD for input
			)
				.toISOString()
				.split("T")[0],
			periodEnd: new Date(
				new Date().getFullYear(),
				new Date().getMonth() + 1,
				0,
				12,
			)
				.toISOString()
				.split("T")[0],
			paymentDate: new Date(
				new Date().getFullYear(),
				new Date().getMonth() + 1,
				0,
				12,
			)
				.toISOString()
				.split("T")[0],
		},
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		createPayrollRun.mutate(
			{
				periodStart: new Date(values.periodStart).toISOString(),
				periodEnd: new Date(values.periodEnd).toISOString(),
				paymentDate: new Date(values.paymentDate).toISOString(),
			},
			{
				onSuccess: () => {
					toast.success("Payroll run created successfully");
					setOpen(false);
					form.reset();
				},
				onError: () => {
					toast.error("Failed to create payroll run");
				},
			},
		);
	}

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					Run Payroll
				</Button>
			</SheetTrigger>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Run Payroll</SheetTitle>
					<SheetDescription>
						Create a new payroll run for a specific period.
					</SheetDescription>
				</SheetHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4 py-4"
					>
						<FormField
							control={form.control}
							name="periodStart"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Period Start</FormLabel>
									<FormControl>
										<Input type="date" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="periodEnd"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Period End</FormLabel>
									<FormControl>
										<Input type="date" {...field} />
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
						<Button
							type="submit"
							className="w-full"
							disabled={createPayrollRun.isPending}
						>
							{createPayrollRun.isPending ? "Creating..." : "Create Run"}
						</Button>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}
