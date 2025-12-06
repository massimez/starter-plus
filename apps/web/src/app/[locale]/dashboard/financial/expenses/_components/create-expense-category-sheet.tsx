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
import { Textarea } from "@workspace/ui/components/textarea";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useCreateExpenseCategory } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-expenses";

const formSchema = z.object({
	name: z.string().min(1, "Category name is required"),
	description: z.string().optional(),
});

export function CreateExpenseCategorySheet() {
	const createCategoryMutation = useCreateExpenseCategory();
	const [open, setOpen] = useState(false);

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			description: "",
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		toast.promise(
			createCategoryMutation.mutateAsync(values).then(() => {
				setOpen(false);
				form.reset();
			}),
			{
				loading: "Creating expense category...",
				success: "Expense category created successfully",
				error: "Failed to create expense category",
			},
		);
	}

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button variant="outline">
					<Plus className="mr-2 h-4 w-4" />
					Add Category
				</Button>
			</SheetTrigger>
			<SheetContent className="sm:max-w-[500px]">
				<SheetHeader>
					<SheetTitle>Add Expense Category</SheetTitle>
					<SheetDescription>
						Create a new category for organizing expenses.
					</SheetDescription>
				</SheetHeader>
				<div className="mt-6">
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Category Name</FormLabel>
										<FormControl>
											<Input placeholder="e.g. Travel, Meals" {...field} />
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
										<FormLabel>Description (Optional)</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Describe this expense category..."
												className="resize-none"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button type="submit" className="w-full">
								Create Category
							</Button>
						</form>
					</Form>
				</div>
			</SheetContent>
		</Sheet>
	);
}
