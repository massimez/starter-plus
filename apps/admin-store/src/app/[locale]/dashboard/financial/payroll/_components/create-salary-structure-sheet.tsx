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
import { Coins } from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { useFinancialPayroll } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-payroll";
import { useCurrency } from "@/app/providers/currency-provider";

const formSchema = z.object({
	employeeId: z.string().min(1, "Employee is required"),
	effectiveFrom: z.string().min(1, "Effective date is required"),
	baseSalary: z.number().positive("Base salary must be positive"),
	currency: z.string().length(3, "Currency must be 3 characters"),
	paymentFrequency: z.enum(["monthly", "bi_weekly", "weekly"]),
	components: z.array(
		z.object({
			componentId: z.string().min(1, "Component is required"),
			amount: z.number().optional(),
			percentage: z.number().min(0).max(100).optional(),
			calculationBasis: z.enum(["base_salary", "gross_salary"]).optional(),
		}),
	),
});

type FormData = z.infer<typeof formSchema>;

interface CreateSalaryStructureSheetProps {
	// biome-ignore lint/suspicious/noExplicitAny: complex structure
	editingStructure?: any;
}

export function CreateSalaryStructureSheet({
	editingStructure,
}: CreateSalaryStructureSheetProps = {}) {
	const [open, setOpen] = useState(false);
	const { useEmployees, useSalaryComponents, useCreateSalaryStructure } =
		useFinancialPayroll();
	const { data: employees } = useEmployees();
	const { data: salaryComponents } = useSalaryComponents();
	const createSalaryStructure = useCreateSalaryStructure();

	const { currency } = useCurrency(); // Added useCurrency hook

	const isEditing = !!editingStructure;

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			employeeId: editingStructure?.employee?.id || "",
			effectiveFrom: editingStructure?.effectiveFrom?.split("T")[0] || "",
			baseSalary: Number(editingStructure?.baseSalary) || 0,
			currency: editingStructure?.currency || currency, // Changed default currency to use the hook's value
			paymentFrequency: editingStructure?.paymentFrequency || "monthly",
			components:
				editingStructure?.components?.map(
					(comp: {
						componentId: string;
						amount: number;
						percentage: number;
						calculationBasis: "base_salary" | "gross_salary";
					}) => ({
						componentId: comp.componentId,
						amount: comp.amount,
						percentage: comp.percentage,
						calculationBasis: comp.calculationBasis || "base_salary",
					}),
				) || [],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "components",
	});

	useEffect(() => {
		if (open) {
			form.setValue("currency", currency);
		}
	}, [open, currency, form]);

	function onSubmit(values: FormData) {
		createSalaryStructure.mutate(
			{
				...values,
				effectiveFrom: new Date(values.effectiveFrom).toISOString(),
			},
			{
				onSuccess: () => {
					toast.success(
						isEditing
							? "Salary structure updated successfully"
							: "Salary structure created successfully",
					);
					setOpen(false);
					form.reset({
						employeeId: "",
						effectiveFrom: "",
						baseSalary: 0,
						currency: currency,
						paymentFrequency: "monthly",
						components: [],
					});
				},
				onError: () => {
					toast.error(
						isEditing
							? "Failed to update salary structure"
							: "Failed to create salary structure",
					);
				},
			},
		);
	}

	const addComponent = () => {
		append({
			componentId: "",
			amount: undefined,
			percentage: undefined,
			calculationBasis: "base_salary",
		});
	};

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button variant={isEditing ? "ghost" : "primary"}>
					<Coins className="mr-2 h-4 w-4" />
					{isEditing ? "Edit " : "Add Salary Structure"}
				</Button>
			</SheetTrigger>
			<SheetContent className="w-full max-w-2xl overflow-y-auto">
				<SheetHeader>
					<SheetTitle>
						{isEditing ? "Edit Salary Structure" : "Create Salary Structure"}
					</SheetTitle>
					<SheetDescription>
						{isEditing
							? `Update salary structure for ${editingStructure.employee?.firstName} ${editingStructure.employee?.lastName}`
							: "Define an employee's base salary and salary components."}
					</SheetDescription>
				</SheetHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4 py-4"
					>
						{/* Employee Selection */}
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
											{employees?.map((employee) => (
												<SelectItem key={employee.id} value={employee.id}>
													{employee.employeeCode} - {employee.firstName}{" "}
													{employee.lastName}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Basic Salary Info */}
						<div className="grid grid-cols-1 gap-4">
							<FormField
								control={form.control}
								name="effectiveFrom"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Effective From</FormLabel>
										<FormControl>
											<Input type="date" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
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

						<div className="grid grid-cols-1 gap-4">
							<FormField
								control={form.control}
								name="baseSalary"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Base Salary</FormLabel>
										<FormControl>
											<Input
												type="number"
												placeholder=""
												{...field}
												onChange={(e) => field.onChange(Number(e.target.value))}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="grid grid-cols-1 gap-4">
							<FormField
								control={form.control}
								name="currency"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Currency</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select currency" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="USD">USD ($)</SelectItem>
												<SelectItem value="EUR">EUR (€)</SelectItem>
												<SelectItem value="GBP">GBP (£)</SelectItem>
												<SelectItem value="JPY">JPY (¥)</SelectItem>
												<SelectItem value="CAD">CAD ($)</SelectItem>
												<SelectItem value="AUD">AUD ($)</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Salary Components */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<h4 className="font-medium text-sm">Salary Components</h4>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={addComponent}
								>
									Add Component
								</Button>
							</div>

							<div className="space-y-4">
								{fields.map((field, index) => (
									<div
										key={field.id}
										className="space-y-3 rounded border bg-muted/20 p-4"
									>
										{/* Row 1: Component and Remove Button */}
										<div className="flex items-end gap-3">
											<FormField
												control={form.control}
												name={`components.${index}.componentId`}
												render={({ field: componentField }) => (
													<FormItem className="flex-1">
														<FormLabel className="text-xs">
															Salary Component
														</FormLabel>
														<Select
															onValueChange={componentField.onChange}
															defaultValue={componentField.value}
														>
															<FormControl>
																<SelectTrigger className="h-9">
																	<SelectValue placeholder="Select component" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{salaryComponents?.map((component) => (
																	<SelectItem
																		key={component.id}
																		value={component.id}
																	>
																		{component.name}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>

											<Button
												type="button"
												variant="destructive"
												size="sm"
												className="h-9 px-3"
												onClick={() => remove(index)}
											>
												Remove
											</Button>
										</div>

										{/* Row 2: Calculation Fields */}
										<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
											<FormField
												control={form.control}
												name={`components.${index}.amount`}
												render={({ field: amountField }) => (
													<FormItem>
														<FormLabel className="text-xs">
															Fixed Amount ({form.watch("currency") || "USD"})
														</FormLabel>
														<FormControl>
															<Input
																type="number"
																placeholder=""
																className="h-9"
																{...amountField}
																onChange={(e) =>
																	amountField.onChange(
																		e.target.value
																			? Number(e.target.value)
																			: undefined,
																	)
																}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name={`components.${index}.percentage`}
												render={({ field: percentageField }) => (
													<FormItem>
														<FormLabel className="text-xs">
															Percentage (%)
														</FormLabel>
														<FormControl>
															<Input
																type="number"
																placeholder=""
																min="0"
																max="100"
																className="h-9"
																{...percentageField}
																onChange={(e) =>
																	percentageField.onChange(
																		e.target.value
																			? Number(e.target.value)
																			: undefined,
																	)
																}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name={`components.${index}.calculationBasis`}
												render={({ field: basisField }) => (
													<FormItem>
														<FormLabel className="text-xs">Based on</FormLabel>
														<Select
															onValueChange={basisField.onChange}
															defaultValue={basisField.value || "base_salary"}
														>
															<FormControl>
																<SelectTrigger className="h-9">
																	<SelectValue />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="base_salary">
																	Base Salary
																</SelectItem>
																<SelectItem value="gross_salary">
																	Gross Salary
																</SelectItem>
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									</div>
								))}
							</div>
						</div>

						<Button
							type="submit"
							className="w-full"
							disabled={createSalaryStructure.isPending}
						>
							{createSalaryStructure.isPending
								? isEditing
									? "Updating..."
									: "Creating..."
								: isEditing
									? "Update Salary Structure"
									: "Create Salary Structure"}
						</Button>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}
