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
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { useFinancialPayroll } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-payroll";

const formSchema = z.object({
	employeeCode: z.string().min(1, "Employee code is required"),
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.string().email().optional().or(z.literal("")),
	phone: z.string().optional(),
	position: z.string().optional(),
	hireDate: z.string().min(1, "Hire date is required"),
	employmentType: z.enum(["full_time", "part_time", "contract"]),
	bankAccountNumber: z.string().optional(),
	taxId: z.string().optional(),
});

export function CreateEmployeeSheet() {
	const [open, setOpen] = useState(false);
	const { useCreateEmployee } = useFinancialPayroll();
	const createEmployee = useCreateEmployee();

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
		},
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		createEmployee.mutate(
			{
				...values,
				email: values.email || undefined,
				phone: values.phone || undefined,
				position: values.position || undefined,
				bankAccountNumber: values.bankAccountNumber || undefined,
				taxId: values.taxId || undefined,
				hireDate: new Date(values.hireDate).toISOString(),
			},
			{
				onSuccess: () => {
					toast.success("Employee created successfully");
					setOpen(false);
					form.reset();
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
			<SheetContent className="w-full sm:max-w-lg">
				<SheetHeader>
					<SheetTitle>Add New Employee</SheetTitle>
					<SheetDescription>
						Create a new employee profile for payroll management.
					</SheetDescription>
				</SheetHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4 py-4"
					>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="employeeCode"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Employee Code</FormLabel>
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
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="firstName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>First Name</FormLabel>
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
										<FormLabel>Last Name</FormLabel>
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
										<FormLabel>Email (Optional)</FormLabel>
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
										<FormLabel>Phone (Optional)</FormLabel>
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
									<FormLabel>Position (Optional)</FormLabel>
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
									<FormLabel>Hire Date</FormLabel>
									<FormControl>
										<Input type="date" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="bankAccountNumber"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Bank Account (Optional)</FormLabel>
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
										<FormLabel>Tax ID (Optional)</FormLabel>
										<FormControl>
											<Input placeholder="TAX123456" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
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
