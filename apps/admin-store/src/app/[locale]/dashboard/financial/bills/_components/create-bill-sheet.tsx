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
import { DollarSign, FileText, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useFinancialAccounting } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-accounting";
import {
	useCreateInvoice,
	useInvoice,
	useUpdateInvoice,
} from "@/app/[locale]/dashboard/financial/_hooks/use-invoices";
import { useSuppliers } from "@/app/[locale]/dashboard/store/suppliers/hooks/use-suppliers";
import { useCurrency } from "@/app/providers/currency-provider";
import { formatCurrency } from "@/lib/helpers";

const billItemSchema = z.object({
	description: z.string().min(1, "Description is required"),
	quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
	unitPrice: z.coerce.number().min(0, "Unit price must be positive"),
	accountId: z.string().min(1, "Account is required"),
	taxRate: z.coerce.number().min(0).max(100).optional(),
});

const formSchema = z.object({
	supplierId: z.string().min(1, "Supplier is required"),
	invoiceNumber: z.string().min(1, "Bill Number is required"),
	date: z.string().min(1, "Date is required"),
	dueDate: z.string().min(1, "Due Date is required"),
	items: z.array(billItemSchema).min(1, "At least one item is required"),
});

interface Supplier {
	id: string;
	name: string;
}

interface Account {
	id: string;
	code: string;
	name: string;
	accountCategory?: {
		accountType?: {
			name: string;
		};
	};
}

interface BillSheetProps {
	billId?: string;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: React.ReactNode;
}

export function CreateBillSheet({
	billId,
	open: controlledOpen,
	onOpenChange: controlledOnOpenChange,
}: BillSheetProps) {
	const [internalOpen, setInternalOpen] = useState(false);
	const open = controlledOpen ?? internalOpen;
	const setOpen = controlledOnOpenChange ?? setInternalOpen;
	const { currency } = useCurrency();

	const { useAccounts } = useFinancialAccounting();
	const { data: accounts } = useAccounts();
	const { data: suppliersData } = useSuppliers();

	// Fetch bill details if editing
	const { data: existingBill, isLoading: isLoadingBill } = useInvoice(
		billId || "",
	);

	const createBill = useCreateInvoice();
	const updateBill = useUpdateInvoice();
	const isEditing = !!billId;

	const suppliers = (suppliersData?.data as Supplier[]) || [];
	const expenseAccounts = (accounts as Account[]) || [];

	const form = useForm<z.infer<typeof formSchema>>({
		// biome-ignore lint/suspicious/noExplicitAny: pragmatic fix for hookform resolver mismatch
		resolver: zodResolver(formSchema) as any,
		defaultValues: {
			supplierId: "",
			invoiceNumber: `BILL-${Date.now()}`,
			date: new Date().toISOString().split("T")[0],
			dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
				.toISOString()
				.split("T")[0],
			items: [
				{
					accountId: "",
					description: "",
					quantity: 1,
					unitPrice: 0,
				},
			],
		},
	});

	// Populate form with existing bill data
	useEffect(() => {
		if (existingBill && isEditing && !isLoadingBill) {
			form.reset({
				supplierId: existingBill.supplierId || "",
				invoiceNumber: existingBill.invoiceNumber || "",
				date: new Date(existingBill.invoiceDate).toISOString().split("T")[0],
				dueDate: new Date(existingBill.dueDate).toISOString().split("T")[0],
				items: (existingBill.lines || []).map(
					(line: {
						accountId: string;
						description: string;
						quantity: string | null;
						unitPrice: string | null;
					}) => ({
						accountId: line.accountId,
						description: line.description || "",
						quantity: Number(line.quantity ?? 1),
						unitPrice: Number(line.unitPrice ?? 0),
					}),
				),
			});
		}
	}, [existingBill, isEditing, isLoadingBill, form]);

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "items",
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		const payload = {
			invoiceType: "payable" as const,
			supplierId: values.supplierId,
			invoiceNumber: values.invoiceNumber,
			invoiceDate: new Date(values.date),
			dueDate: new Date(values.dueDate),
			currency: currency,
			items: values.items.map((item) => ({
				accountId: item.accountId,
				description: item.description,
				quantity: Number(item.quantity),
				unitPrice: Number(item.unitPrice),
			})),
		};

		if (isEditing && billId) {
			updateBill.mutate(
				{ id: billId, data: payload },
				{
					onSuccess: () => {
						toast.success("Bill updated successfully");
						setOpen(false);
						if (!isEditing) form.reset(); // Don't reset heavily on edit close immediately?
					},
					onError: (error: Error) => toast.error(error.message),
				},
			);
		} else {
			createBill.mutate(payload, {
				onSuccess: () => {
					toast.success("Bill created successfully");
					setOpen(false);
					form.reset();
				},
				onError: (error: Error) => toast.error(error.message),
			});
		}
	}

	const isPending = createBill.isPending || updateBill.isPending;

	const calculateTotal = () => {
		const items = form.watch("items");
		return items.reduce((acc, item) => {
			return acc + Number(item.quantity) * Number(item.unitPrice);
		}, 0);
	};

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			{!controlledOpen && ( // Only show internal trigger if not controlled (or if we want to support both, but cleaner this way)
				<SheetTrigger asChild>
					<Button size="sm" className="h-8 gap-1">
						<Plus className="h-3.5 w-3.5" />
						<span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
							{isEditing ? "Edit Bill" : "New Bill"}
						</span>
					</Button>
				</SheetTrigger>
			)}
			<SheetContent className="overflow-y-auto sm:max-w-[800px]">
				<SheetHeader>
					<SheetTitle>{isEditing ? "Edit Bill" : "New Bill"}</SheetTitle>
					<SheetDescription>
						{isEditing
							? "Update existing vendor bill."
							: "Record a new vendor bill."}
					</SheetDescription>
				</SheetHeader>
				<div className="mt-8">
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							{/* Form Fields... (keeping structure same, just updating context) */}
							<div className="space-y-4 rounded-lg border bg-muted/40 p-4">
								<h3 className="flex items-center gap-2 font-semibold text-sm">
									<FileText className="h-4 w-4 text-blue-500" />
									Bill Details
								</h3>
								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="supplierId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Supplier</FormLabel>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select supplier" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{suppliers.map((supplier) => (
															<SelectItem key={supplier.id} value={supplier.id}>
																{supplier.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="invoiceNumber"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Bill Number</FormLabel>
												<FormControl>
													<Input placeholder="e.g. INV-2024-001" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="date"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Bill Date</FormLabel>
												<FormControl>
													<Input type="date" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="dueDate"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Due Date</FormLabel>
												<FormControl>
													<Input type="date" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</div>

							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<h3 className="flex items-center gap-2 font-semibold text-sm">
										<DollarSign className="h-4 w-4 text-green-500" />
										Line Items
									</h3>
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="h-8 text-xs"
										onClick={() =>
											append({
												accountId: "",
												description: "",
												quantity: 1,
												unitPrice: 0,
											})
										}
									>
										<Plus className="mr-1 h-3 w-3" />
										Add Line
									</Button>
								</div>

								<div className="space-y-3">
									{fields.map((field, index) => (
										<div
											key={field.id}
											className="grid grid-cols-12 items-end gap-2 rounded-md border bg-card p-2"
										>
											<div className="col-span-12 md:col-span-4">
												<FormField
													control={form.control}
													name={`items.${index}.accountId`}
													render={({ field }) => (
														<FormItem className="space-y-1">
															<FormLabel className="text-muted-foreground text-xs">
																Account
															</FormLabel>
															<Select
																onValueChange={field.onChange}
																defaultValue={field.value}
															>
																<FormControl>
																	<SelectTrigger className="h-8">
																		<SelectValue placeholder="Select account" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{expenseAccounts.map((account) => (
																		<SelectItem
																			key={account.id}
																			value={account.id}
																		>
																			<span className="mr-2 font-mono text-muted-foreground text-xs">
																				{account.code}
																			</span>
																			{account.name}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
											<div className="col-span-12 md:col-span-4">
												<FormField
													control={form.control}
													name={`items.${index}.description`}
													render={({ field }) => (
														<FormItem className="space-y-1">
															<FormLabel className="text-muted-foreground text-xs">
																Description
															</FormLabel>
															<FormControl>
																<Input
																	{...field}
																	placeholder="Item description"
																	className="h-8"
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
											<div className="col-span-4 md:col-span-1">
												<FormField
													control={form.control}
													name={`items.${index}.quantity`}
													render={({ field }) => (
														<FormItem className="space-y-1">
															<FormLabel className="text-muted-foreground text-xs">
																Qty
															</FormLabel>
															<FormControl>
																<Input
																	type="number"
																	min="1"
																	{...field}
																	className="h-8"
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
											<div className="col-span-6 md:col-span-2">
												<FormField
													control={form.control}
													name={`items.${index}.unitPrice`}
													render={({ field }) => (
														<FormItem className="space-y-1">
															<FormLabel className="text-muted-foreground text-xs">
																Price
															</FormLabel>
															<div className="relative">
																<span className="-translate-y-1/2 absolute top-1/2 left-2 text-muted-foreground">
																	$
																</span>
																<Input
																	type="number"
																	step="0.01"
																	{...field}
																	className="h-8 pl-6"
																/>
															</div>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
											<div className="col-span-2 flex justify-end pt-6 md:col-span-1">
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-muted-foreground hover:text-destructive"
													onClick={() => remove(index)}
													disabled={fields.length === 1}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
									))}
								</div>

								<div className="flex justify-end rounded-lg bg-muted/20 p-4">
									<div className="text-right">
										<p className="mb-1 text-muted-foreground text-sm">
											Total Amount
										</p>
										<p className="font-bold text-3xl">
											{formatCurrency(calculateTotal(), currency)}
										</p>
									</div>
								</div>
							</div>

							<div className="flex gap-3 pt-4">
								<Button
									type="button"
									variant="outline"
									className="w-full"
									onClick={() => setOpen(false)}
								>
									Cancel
								</Button>
								<Button type="submit" className="w-full" disabled={isPending}>
									{isPending
										? isEditing
											? "Updating..."
											: "Creating..."
										: isEditing
											? "Update Bill"
											: "Create Bill"}
								</Button>
							</div>
						</form>
					</Form>
				</div>
			</SheetContent>
		</Sheet>
	);
}
