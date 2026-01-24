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
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
	useCreateExpense,
	useExpenseCategories,
	useUpdateExpense,
} from "@/app/[locale]/dashboard/financial/_hooks/use-financial-expenses";
import { useCurrency } from "@/app/providers/currency-provider";

const formSchema = z.object({
	categoryId: z.string().min(1, "Category is required"),
	amount: z.string().min(1, "Amount is required"),
	currency: z.string().length(3).default("USD"),
	date: z.string().min(1, "Date is required"),
	description: z.string().min(1, "Description is required"),
});

type Expense = {
	id: string;
	categoryId?: string; // Made optional as we might access it via category object
	amount: string | number;
	currency: string;
	expenseDate: string | Date;
	description: string;
	category?: {
		id: string;
		name: string;
	};
};

interface CreateExpenseSheetProps {
	expenseToEdit?: Expense | null;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function CreateExpenseSheet({
	expenseToEdit,
	open: controlledOpen,
	onOpenChange: setControlledOpen,
}: CreateExpenseSheetProps) {
	const { data: categories } = useExpenseCategories();
	const createExpenseMutation = useCreateExpense();
	const updateExpenseMutation = useUpdateExpense();

	const { currency } = useCurrency(); // Get global currency

	const [localOpen, setLocalOpen] = useState(false);

	const isOpen = controlledOpen !== undefined ? controlledOpen : localOpen;
	const setOpen = setControlledOpen || setLocalOpen;

	const isEditing = !!expenseToEdit;

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			categoryId: "",
			amount: "",
			currency: currency, // Use global currency
			date: new Date().toISOString().split("T")[0],
			description: "",
		},
	});

	useEffect(() => {
		if (isOpen) {
			if (expenseToEdit) {
				form.reset({
					categoryId:
						expenseToEdit.category?.id || expenseToEdit.categoryId || "",
					amount: expenseToEdit.amount.toString(),
					currency: expenseToEdit.currency,
					date: new Date(expenseToEdit.expenseDate).toISOString().split("T")[0],
					description: expenseToEdit.description,
				});
			} else {
				form.reset({
					categoryId: "",
					amount: "",
					currency: currency, // Reset to global currency for new expense
					date: new Date().toISOString().split("T")[0],
					description: "",
				});
			}
		}
	}, [isOpen, expenseToEdit, form, currency]);

	function onSubmit(values: z.infer<typeof formSchema>) {
		const commonData = {
			categoryId: values.categoryId,
			amount: Number.parseFloat(values.amount),
			currency: values.currency,
			expenseDate: new Date(values.date),
			description: values.description,
		};

		const promise = isEditing
			? updateExpenseMutation.mutateAsync({
					id: expenseToEdit?.id,
					...commonData,
				})
			: createExpenseMutation.mutateAsync(commonData);

		toast.promise(
			promise.then(() => {
				setOpen(false);
				if (!isEditing) form.reset();
			}),
			{
				loading: isEditing ? "Updating expense..." : "Creating expense...",
				success: isEditing
					? "Expense updated successfully"
					: "Expense created successfully",
				error: isEditing
					? "Failed to update expense"
					: "Failed to create expense",
			},
		);
	}

	const isLoading =
		createExpenseMutation.isPending || updateExpenseMutation.isPending;

	return (
		<Sheet open={isOpen} onOpenChange={setOpen}>
			{!controlledOpen && (
				<SheetTrigger asChild>
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						New Expense
					</Button>
				</SheetTrigger>
			)}
			<SheetContent className="sm:max-w-[500px]">
				<SheetHeader>
					<SheetTitle>{isEditing ? "Edit Expense" : "New Expense"}</SheetTitle>
					<SheetDescription>
						{isEditing
							? "Update exisiting expense details."
							: "Record a new expense claim."}
					</SheetDescription>
				</SheetHeader>
				<div className="mt-6">
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="categoryId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Category</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select category" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{categories?.map(
													(cat: { id: string; name: string }) => (
														<SelectItem key={cat.id} value={cat.id}>
															{cat.name}
														</SelectItem>
													),
												)}
												{!categories?.length && (
													<SelectItem value="mock-id" disabled>
														No categories found
													</SelectItem>
												)}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="grid grid-cols-1 gap-4">
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
													placeholder="0.00"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
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
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Input placeholder="e.g. Client Lunch" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								{isEditing ? "Update Expense" : "Create Expense"}
							</Button>
						</form>
					</Form>
				</div>
			</SheetContent>
		</Sheet>
	);
}
