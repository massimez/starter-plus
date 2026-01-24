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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@workspace/ui/components/sheet";
import { Textarea } from "@workspace/ui/components/textarea";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { useFinancialPayroll } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-payroll";

const formSchema = z.object({
	employeeId: z.string().min(1, "Employee is required"),
	amount: z.coerce.number().min(1, "Amount must be greater than 0"),
	installments: z.coerce.number().min(1, "Installments must be at least 1"),
	notes: z.string().optional(),
});

type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

export function CreateSalaryAdvanceSheet() {
	const [open, setOpen] = useState(false);
	const { useEmployees, useRequestSalaryAdvance } = useFinancialPayroll();
	const { data: employees } = useEmployees();
	const requestAdvance = useRequestSalaryAdvance();

	const form = useForm<FormInput, unknown, FormOutput>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			employeeId: "",
			amount: 0,
			installments: 1,
			notes: "",
		},
	});

	function onSubmit(values: FormOutput) {
		requestAdvance.mutate(
			{
				...values,
			},
			{
				onSuccess: () => {
					toast.success("Salary advance requested successfully");
					setOpen(false);
					form.reset();
				},
				onError: () => {
					toast.error("Failed to request salary advance");
				},
			},
		);
	}

	const activeEmployees = employees?.filter((e) => e.status === "active") || [];

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					Request Advance
				</Button>
			</SheetTrigger>
			<SheetContent className="w-full overflow-y-auto sm:max-w-lg">
				<SheetHeader>
					<SheetTitle>Request Salary Advance</SheetTitle>
					<SheetDescription>
						Create a new salary advance request for an employee.
					</SheetDescription>
				</SheetHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-6 py-4"
					>
						<FormField
							control={form.control}
							name="employeeId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Employee</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select employee" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{activeEmployees.map((employee) => (
												<SelectItem key={employee.id} value={employee.id}>
													{employee.firstName} {employee.lastName} (
													{employee.employeeCode})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="amount"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Amount</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												name={field.name}
												ref={field.ref}
												value={String(field.value ?? "")}
												onChange={(e) => field.onChange(e.target.value)}
												onBlur={field.onBlur}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="installments"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Installments (Months)</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={1}
												name={field.name}
												ref={field.ref}
												value={String(field.value ?? "")}
												onChange={(e) => field.onChange(e.target.value)}
												onBlur={field.onBlur}
											/>
										</FormControl>
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
											placeholder="Reason for advance..."
											className="resize-none"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button
							type="submit"
							className="w-full"
							disabled={requestAdvance.isPending}
						>
							{requestAdvance.isPending ? "Submitting..." : "Submit Request"}
						</Button>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}
