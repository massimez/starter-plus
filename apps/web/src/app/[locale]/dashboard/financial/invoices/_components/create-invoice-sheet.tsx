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
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const itemSchema = z.object({
	description: z.string().min(1, "Description is required"),
	quantity: z.string().min(1, "Quantity is required"),
	unitPrice: z.string().min(1, "Price is required"),
});

const formSchema = z.object({
	customerId: z.string().min(1, "Customer is required"),
	invoiceNumber: z.string().min(1, "Invoice Number is required"),
	date: z.string().min(1, "Date is required"),
	dueDate: z.string().min(1, "Due Date is required"),
	items: z.array(itemSchema).min(1, "At least one item is required"),
});

export function CreateInvoiceSheet() {
	const [open, setOpen] = useState(false);
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			customerId: "",
			invoiceNumber: `INV-${Date.now()}`,
			date: new Date().toISOString().split("T")[0],
			dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
				.toISOString()
				.split("T")[0],
			items: [{ description: "", quantity: "1", unitPrice: "0" }],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "items",
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		toast.success("Invoice created (Mock)");
		console.log(values);
		setOpen(false);
		form.reset();
	}

	const calculateTotal = () => {
		const items = form.watch("items");
		return items.reduce((acc, item) => {
			return acc + Number(item.quantity) * Number(item.unitPrice);
		}, 0);
	};

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					New Invoice
				</Button>
			</SheetTrigger>
			<SheetContent className="overflow-y-auto sm:max-w-[600px]">
				<SheetHeader>
					<SheetTitle>New Invoice</SheetTitle>
					<SheetDescription>Create a new customer invoice.</SheetDescription>
				</SheetHeader>
				<div className="mt-6">
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="customerId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Customer ID</FormLabel>
										<FormControl>
											<Input placeholder="Customer UUID" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="invoiceNumber"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Invoice Number</FormLabel>
										<FormControl>
											<Input placeholder="INV-001" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="date"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Date</FormLabel>
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

							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<FormLabel>Items</FormLabel>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() =>
											append({ description: "", quantity: "1", unitPrice: "0" })
										}
									>
										Add Item
									</Button>
								</div>
								{fields.map((field, index) => (
									<div
										key={field.id}
										className="grid grid-cols-12 items-end gap-2 rounded-md border p-2"
									>
										<div className="col-span-12">
											<FormField
												control={form.control}
												name={`items.${index}.description`}
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-xs">
															Description
														</FormLabel>
														<FormControl>
															<Input
																{...field}
																placeholder="Item description"
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										<div className="col-span-4">
											<FormField
												control={form.control}
												name={`items.${index}.quantity`}
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-xs">Qty</FormLabel>
														<FormControl>
															<Input type="number" min="1" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										<div className="col-span-6">
											<FormField
												control={form.control}
												name={`items.${index}.unitPrice`}
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-xs">Price</FormLabel>
														<FormControl>
															<Input type="number" step="0.01" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										<div className="col-span-2">
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() => remove(index)}
												disabled={fields.length === 1}
											>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</div>
									</div>
								))}
								<div className="flex justify-end pt-2">
									<p className="font-medium text-sm">
										Total:{" "}
										{new Intl.NumberFormat("en-US", {
											style: "currency",
											currency: "USD",
										}).format(calculateTotal())}
									</p>
								</div>
							</div>

							<Button type="submit" className="w-full">
								Create Invoice
							</Button>
						</form>
					</Form>
				</div>
			</SheetContent>
		</Sheet>
	);
}
