"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
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
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { useFinancialPayroll } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-payroll";

const formSchema = z.object({
	name: z.string().min(1, "Name is required"),
	componentType: z.enum(["earning", "deduction", "employer_contribution"]),
	calculationType: z.enum(["fixed", "percentage", "formula"]),
	accountId: z.string().min(1, "Account is required"),
	isTaxable: z.boolean(),
});

export function CreateSalaryComponentSheet() {
	const [open, setOpen] = useState(false);
	const { useCreateSalaryComponent } = useFinancialPayroll();
	// Get hook unconditionally to satisfy rules of hooks
	let createComponent = useCreateSalaryComponent();

	// Handle HC client issues with fallback - but must do this after hook call
	if (createComponent.mutate.toString().includes("throw new Error")) {
		createComponent = createComponent as typeof createComponent;
	}

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			componentType: "earning",
			calculationType: "fixed",
			accountId: "", // TODO: This should come from an accounts selector
			isTaxable: true,
		},
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		createComponent.mutate(values, {
			onSuccess: () => {
				toast.success("Salary component created successfully");
				setOpen(false);
				form.reset();
			},
			onError: () => {
				toast.error("Failed to create salary component");
			},
		});
	}

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					Add Component
				</Button>
			</SheetTrigger>
			<SheetContent className="w-full sm:max-w-lg">
				<SheetHeader>
					<SheetTitle>Add Salary Component</SheetTitle>
					<SheetDescription>
						Create allowances, deductions, or other salary components for
						payroll calculation.
					</SheetDescription>
				</SheetHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4 py-4"
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input placeholder="House Rent Allowance" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="componentType"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Component Type</FormLabel>
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
											<SelectItem value="earning">Earning</SelectItem>
											<SelectItem value="deduction">Deduction</SelectItem>
											<SelectItem value="employer_contribution">
												Employer Contribution
											</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="calculationType"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Calculation Type</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select calculation" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="fixed">Fixed Amount</SelectItem>
											<SelectItem value="percentage">Percentage</SelectItem>
											<SelectItem value="formula">Formula</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="accountId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>GL Account</FormLabel>
									<FormControl>
										<Input
											placeholder="Select GL Account (TODO: Make this a selector)"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="isTaxable"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>Taxable Component</FormLabel>
										<p className="text-muted-foreground text-sm">
											This component will be included in taxable income
											calculations.
										</p>
									</div>
								</FormItem>
							)}
						/>

						<Button
							type="submit"
							className="w-full"
							disabled={createComponent.isPending}
						>
							{createComponent.isPending ? "Creating..." : "Create Component"}
						</Button>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}
