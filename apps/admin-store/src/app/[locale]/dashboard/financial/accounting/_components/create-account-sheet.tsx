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
import { useFinancialAccounting } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-accounting";

const formSchema = z.object({
	code: z.string().min(1, "Account code is required"),
	name: z.string().min(1, "Account name is required"),
	accountType: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
	category: z.string().optional(),
	normalBalance: z.enum(["debit", "credit"]),
	description: z.string().optional(),
	allowManualEntries: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

const accountTypeOptions = [
	{ value: "asset", label: "Asset" },
	{ value: "liability", label: "Liability" },
	{ value: "equity", label: "Equity" },
	{ value: "revenue", label: "Revenue" },
	{ value: "expense", label: "Expense" },
];

const normalBalanceMap: Record<string, "debit" | "credit"> = {
	asset: "debit",
	expense: "debit",
	liability: "credit",
	equity: "credit",
	revenue: "credit",
};

export function CreateAccountSheet() {
	const [open, setOpen] = useState(false);
	const { useCreateAccount } = useFinancialAccounting();
	const createAccount = useCreateAccount();

	const form = useForm<FormValues>({
		// biome-ignore lint/suspicious/noExplicitAny: pragmatic fix for hookform resolver mismatch
		resolver: zodResolver(formSchema) as any,
		defaultValues: {
			code: "",
			name: "",
			accountType: "asset",
			category: "",
			normalBalance: "debit",
			description: "",
			allowManualEntries: true,
		},
	});

	// Auto-set normal balance based on account type
	const handleAccountTypeChange = (value: FormValues["accountType"]) => {
		form.setValue("accountType", value);
		form.setValue(
			"normalBalance",
			normalBalanceMap[value] as "debit" | "credit",
		);
	};

	const onSubmit = async (values: FormValues) => {
		try {
			await createAccount.mutateAsync(values);
			toast.success("Account created successfully");
			form.reset();
			setOpen(false);
		} catch {
			toast.error("Failed to create account");
		}
	};

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					Add Account
				</Button>
			</SheetTrigger>
			<SheetContent className="overflow-y-auto sm:max-w-[540px]">
				<SheetHeader>
					<SheetTitle>Create GL Account</SheetTitle>
					<SheetDescription>
						Add a new account to your chart of accounts.
					</SheetDescription>
				</SheetHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4 pt-4"
					>
						<FormField
							control={form.control}
							name="code"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Account Code*</FormLabel>
									<FormControl>
										<Input placeholder="e.g., 1001" {...field} />
									</FormControl>
									<FormDescription>
										Unique identifier for this account
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Account Name*</FormLabel>
									<FormControl>
										<Input placeholder="e.g., Cash" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="accountType"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Account Type*</FormLabel>
									<Select
										onValueChange={handleAccountTypeChange}
										defaultValue={field.value || "asset"}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select account type" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{accountTypeOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
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
							name="category"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Category</FormLabel>
									<FormControl>
										<Input
											placeholder="e.g., Current Assets, Fixed Assets"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Optional subcategory for this account
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="normalBalance"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Normal Balance*</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="debit">Debit</SelectItem>
											<SelectItem value="credit">Credit</SelectItem>
										</SelectContent>
									</Select>
									<FormDescription>
										Auto-set based on account type
									</FormDescription>
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
										<Textarea
											placeholder="Optional description of the account"
											className="resize-none"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end gap-2 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={createAccount.isPending}>
								{createAccount.isPending ? "Creating..." : "Create Account"}
							</Button>
						</div>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}
