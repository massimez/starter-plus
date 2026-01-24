"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
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
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@workspace/ui/components/sheet";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { useFinancialPayroll } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-payroll";

const formSchema = z.object({
	// Basic info
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.string().email().optional().or(z.literal("")),
	phone: z.string().optional(),
	position: z.string().optional(),
	employmentType: z.enum(["full_time", "part_time", "contract"]).optional(),

	// Salary info
	baseSalary: z.string().optional(),
	currency: z
		.string()
		.length(3, "Currency code must be 3 characters")
		.optional()
		.or(z.literal("")),
	paymentFrequency: z.enum(["monthly", "bi_weekly", "weekly"]).optional(),

	// Payment info
	bankAccountNumber: z.string().optional(),
	taxId: z.string().optional(),
	status: z.enum(["active", "on_leave", "terminated"]).optional(),
	terminationDate: z.string().optional().or(z.literal("")),
});

interface EditEmployeeSheetProps {
	employee: {
		id: string;
		employeeCode: string;
		firstName: string;
		lastName: string;
		email?: string;
		phone?: string;
		position?: string;
		employmentType: "full_time" | "part_time" | "contract";
		baseSalary?: string;
		currency?: string;
		paymentFrequency?: "monthly" | "bi_weekly" | "weekly";
		bankAccountNumber?: string;
		taxId?: string;
		status: "active" | "on_leave" | "terminated";
		terminationDate?: string | null;
		hireDate: string;
	};
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function EditEmployeeSheet({
	employee,
	open,
	onOpenChange,
}: EditEmployeeSheetProps) {
	const { useUpdateEmployee } = useFinancialPayroll();
	const updateEmployee = useUpdateEmployee();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			firstName: employee.firstName,
			lastName: employee.lastName,
			email: employee.email || "",
			phone: employee.phone || "",
			position: employee.position || "",
			employmentType: employee.employmentType,
			baseSalary: employee.baseSalary || "",
			currency: employee.currency || "",
			paymentFrequency: employee.paymentFrequency,
			bankAccountNumber: employee.bankAccountNumber || "",
			taxId: employee.taxId || "",
			status: employee.status,
			terminationDate: employee.terminationDate
				? new Date(employee.terminationDate).toISOString().split("T")[0]
				: "",
		},
	});

	// Reset form when employee changes
	useEffect(() => {
		form.reset({
			firstName: employee.firstName,
			lastName: employee.lastName,
			email: employee.email || "",
			phone: employee.phone || "",
			position: employee.position || "",
			employmentType: employee.employmentType,
			baseSalary: employee.baseSalary || "",
			currency: employee.currency || "",
			paymentFrequency: employee.paymentFrequency,
			bankAccountNumber: employee.bankAccountNumber || "",
			taxId: employee.taxId || "",
			status: employee.status,
			terminationDate: employee.terminationDate
				? new Date(employee.terminationDate).toISOString().split("T")[0]
				: "",
		});
	}, [employee, form]);

	function onSubmit(values: z.infer<typeof formSchema>) {
		// Filter out empty strings and convert them to undefined
		const cleanedValues = Object.fromEntries(
			Object.entries(values).map(([key, value]) => [
				key,
				value === "" ? undefined : value,
			]),
		);

		updateEmployee.mutate(
			{
				employeeId: employee.id,
				data: cleanedValues,
			},
			{
				onSuccess: () => {
					toast.success("Employee updated successfully");
					onOpenChange(false);
				},
				onError: () => {
					toast.error("Failed to update employee");
				},
			},
		);
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full overflow-y-auto sm:max-w-lg">
				<SheetHeader>
					<SheetTitle>Edit Employee</SheetTitle>
					<SheetDescription>
						Update employee information for {employee.employeeCode}.
					</SheetDescription>
				</SheetHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-6 py-4"
					>
						<div className="space-y-4">
							<h3 className="font-medium text-sm">Basic Information</h3>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="firstName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>First Name*</FormLabel>
											<FormControl>
												<Input {...field} />
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
											<FormLabel>Last Name*</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder="employee@company.com"
													{...field}
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
												<Input placeholder="+1 (555) 123-4567" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="position"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Position</FormLabel>
										<FormControl>
											<Input placeholder="Software Engineer" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="employmentType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Employment Type</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select type" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="full_time">Full Time</SelectItem>
													<SelectItem value="part_time">Part Time</SelectItem>
													<SelectItem value="contract">Contract</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
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
													<SelectTrigger>
														<SelectValue placeholder="Select status" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="active">Active</SelectItem>
													<SelectItem value="on_leave">On Leave</SelectItem>
													<SelectItem value="terminated">Terminated</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{form.watch("status") === "terminated" && (
								<FormField
									control={form.control}
									name="terminationDate"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Termination Date</FormLabel>
											<FormControl>
												<Input type="date" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}
						</div>

						<Separator />

						<div className="space-y-4">
							<h3 className="font-medium text-sm">Salary Information</h3>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="baseSalary"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Base Salary</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="50000"
													step="0.01"
													{...field}
												/>
											</FormControl>
											<FormDescription>Annual salary amount</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="currency"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Currency</FormLabel>
											<FormControl>
												<Input
													placeholder="USD"
													maxLength={3}
													{...field}
													onChange={(e) =>
														field.onChange(e.target.value.toUpperCase())
													}
												/>
											</FormControl>
											<FormDescription>3-letter code</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="paymentFrequency"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Payment Frequency</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select frequency" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="monthly">Monthly</SelectItem>
												<SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
												<SelectItem value="weekly">Weekly</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<Separator />

						<div className="space-y-4">
							<h3 className="font-medium text-sm">Payment Details</h3>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="bankAccountNumber"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Bank Account</FormLabel>
											<FormControl>
												<Input placeholder="1234567890" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="taxId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Tax ID</FormLabel>
											<FormControl>
												<Input placeholder="TAX123456" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						<Button
							type="submit"
							className="w-full"
							disabled={updateEmployee.isPending}
						>
							{updateEmployee.isPending ? "Updating..." : "Update Employee"}
						</Button>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}
