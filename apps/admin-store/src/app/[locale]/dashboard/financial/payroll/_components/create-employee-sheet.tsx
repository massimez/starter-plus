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
	SheetTrigger,
} from "@workspace/ui/components/sheet";
import { UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { useFinancialPayroll } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-payroll";
import { useCurrency } from "@/app/providers/currency-provider";

const formSchema = z.object({
	// Basic Info
	employeeCode: z.string().min(1, "Employee code is required"),
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.string().email().optional().or(z.literal("")),
	phone: z.string().optional(),
	position: z.string().optional(),
	hireDate: z.string().min(1, "Hire date is required"),
	employmentType: z.enum(["full_time", "part_time", "contract"]),

	// Payment Info
	bankAccountNumber: z.string().optional(),
	taxId: z.string().optional(),

	// Salary Info
	baseSalary: z.string().min(1, "Base salary is required"),
	currency: z
		.string()
		.length(3, "Currency code must be 3 characters (e.g., USD)"),
	paymentFrequency: z.enum(["monthly", "bi_weekly", "weekly"]),
});

export function CreateEmployeeSheet() {
	const [open, setOpen] = useState(false);
	const { useCreateEmployee } = useFinancialPayroll();
	const createEmployee = useCreateEmployee();
	const { currency } = useCurrency();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			employeeCode: "",
			firstName: "",
			lastName: "",
			email: "",
			phone: "",
			position: "",
			hireDate: "",
			employmentType: "full_time",
			bankAccountNumber: "",
			taxId: "",
			baseSalary: "",
			currency: currency,
			paymentFrequency: "monthly",
		},
	});

	useEffect(() => {
		if (open) {
			form.setValue("currency", currency);
		}
	}, [open, currency, form]);

	function onSubmit(values: z.infer<typeof formSchema>) {
		createEmployee.mutate(
			{
				...values,
				email: values.email || undefined,
				phone: values.phone || undefined,
				position: values.position || undefined,
				taxId: values.taxId || undefined,
				hireDate: new Date(values.hireDate).toISOString(),
				baseSalary: values.baseSalary,
			},
			{
				onSuccess: () => {
					toast.success("Employee created successfully");
					setOpen(false);
					form.reset({
						employeeCode: "",
						firstName: "",
						lastName: "",
						email: "",
						phone: "",
						position: "",
						hireDate: "",
						employmentType: "full_time",
						bankAccountNumber: "",
						taxId: "",
						baseSalary: "",
						currency: currency,
						paymentFrequency: "monthly",
					});
				},
				onError: () => {
					toast.error("Failed to create employee");
				},
			},
		);
	}

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button>
					<UserPlus className="mr-2 h-4 w-4" />
					Add Employee
				</Button>
			</SheetTrigger>
			<SheetContent className="w-full overflow-y-auto sm:max-w-lg">
				<SheetHeader>
					<SheetTitle>Add New Employee</SheetTitle>
					<SheetDescription>
						Create a new employee profile with salary information.
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
									name="employeeCode"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Employee Code*</FormLabel>
											<FormControl>
												<Input placeholder="EMP001" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="employmentType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Employment Type*</FormLabel>
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
							</div>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="firstName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>First Name*</FormLabel>
											<FormControl>
												<Input placeholder="John" {...field} />
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
												<Input placeholder="Doe" {...field} />
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
													placeholder="john.doe@company.com"
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

							<FormField
								control={form.control}
								name="hireDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Hire Date*</FormLabel>
										<FormControl>
											<Input type="date" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<Separator />

						<div className="space-y-4">
							<h3 className="font-medium text-sm">Salary Information</h3>

							<div className="grid grid-cols-1 gap-4">
								<FormField
									control={form.control}
									name="baseSalary"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Base Salary*</FormLabel>
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
							</div>

							<FormField
								control={form.control}
								name="paymentFrequency"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Payment Frequency*</FormLabel>
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
							disabled={createEmployee.isPending}
						>
							{createEmployee.isPending ? "Creating..." : "Create Employee"}
						</Button>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}
