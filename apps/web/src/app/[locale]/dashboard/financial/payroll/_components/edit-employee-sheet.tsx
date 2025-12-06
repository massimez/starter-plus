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
} from "@workspace/ui/components/sheet";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { useFinancialPayroll } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-payroll";

const formSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.string().email().optional().or(z.literal("")),
	phone: z.string().optional(),
	position: z.string().optional(),
	employmentType: z.enum(["full_time", "part_time", "contract"]).optional(),
	bankAccountNumber: z.string().optional(),
	taxId: z.string().optional(),
	status: z.enum(["active", "on_leave", "terminated"]).optional(),
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
		bankAccountNumber?: string;
		taxId?: string;
		status: "active" | "on_leave" | "terminated";
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
			bankAccountNumber: employee.bankAccountNumber || "",
			taxId: employee.taxId || "",
			status: employee.status,
		},
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		updateEmployee.mutate(
			{
				employeeId: employee.id,
				data: values,
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
			<SheetContent className="w-full sm:max-w-lg">
				<SheetHeader>
					<SheetTitle>Edit Employee</SheetTitle>
					<SheetDescription>
						Update employee information for {employee.employeeCode}.
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
								name="firstName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>First Name</FormLabel>
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
										<FormLabel>Last Name</FormLabel>
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
										<FormLabel>Email (Optional)</FormLabel>
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
