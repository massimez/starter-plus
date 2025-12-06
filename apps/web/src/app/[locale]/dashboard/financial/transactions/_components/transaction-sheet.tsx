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
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
	useBankAccounts,
	useCreateBankTransaction,
	useEnsureCashAccount,
} from "@/app/[locale]/dashboard/financial/_hooks/use-financial";

const formSchema = z.object({
	bankAccountId: z.string().optional(),
	amount: z.string().min(1, "Amount is required"),
	type: z.enum(["deposit", "withdrawal"]),
	description: z.string().min(1, "Description is required"),
	date: z.string().min(1, "Date is required"),
	payeePayer: z.string().optional(),
	referenceNumber: z.string().optional(),
});

export function TransactionSheet() {
	const [open, setOpen] = useState(false);
	const { data: bankAccountsData, isLoading: isLoadingAccounts } =
		useBankAccounts();
	const createTransaction = useCreateBankTransaction();
	const ensureCashAccount = useEnsureCashAccount();

	// Track if we've already attempted to create cash account
	const cashAccountAttempted = useRef(false);

	const bankAccounts = bankAccountsData?.data || [];

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			bankAccountId: "",
			amount: "",
			type: "withdrawal",
			description: "",
			date: new Date().toISOString().split("T")[0],
			payeePayer: "",
			referenceNumber: "",
		},
	});

	// Auto-select first account when accounts are loaded
	useEffect(() => {
		if (bankAccounts.length > 0 && !form.getValues("bankAccountId")) {
			form.setValue("bankAccountId", bankAccounts[0]?.id || "");
		}
	}, [bankAccounts, form]);

	// Auto-create cash account if no accounts exist when sheet opens
	// biome-ignore lint/correctness/useExhaustiveDependencies: ensureCashAccount.mutate intentionally omitted to prevent infinite loop
	useEffect(() => {
		if (
			open &&
			!isLoadingAccounts &&
			bankAccounts.length === 0 &&
			!cashAccountAttempted.current
		) {
			// Automatically try to create a cash account
			cashAccountAttempted.current = true;
			ensureCashAccount.mutate();
		}

		// Reset the flag when sheet closes
		if (!open) {
			cashAccountAttempted.current = false;
		}
	}, [open, isLoadingAccounts, bankAccounts.length]);

	async function onSubmit(values: z.infer<typeof formSchema>) {
		// Use selected account or first available account
		const accountId = values.bankAccountId || bankAccounts[0]?.id;

		if (!accountId) {
			toast.error("Please create a bank account first");
			return;
		}

		try {
			await createTransaction.mutateAsync({
				bankAccountId: accountId,
				transactionDate: new Date(values.date),
				transactionType: values.type,
				amount: Number.parseFloat(values.amount),
				description: values.description,
				payeePayer: values.payeePayer || undefined,
				referenceNumber: values.referenceNumber || undefined,
			});

			toast.success("Transaction created successfully");
			form.reset();
			setOpen(false);
		} catch (error) {
			toast.error("Failed to create transaction");
			console.error("Transaction creation error:", error);
		}
	}

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					New Transaction
				</Button>
			</SheetTrigger>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>New Transaction</SheetTitle>
					<SheetDescription>
						Record a new transaction manually.
					</SheetDescription>
				</SheetHeader>
				<div className="mt-6">
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="bankAccountId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Bank Account</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
											disabled={isLoadingAccounts}
										>
											<FormControl>
												<SelectValue placeholder="Select bank account" />
											</FormControl>
											<SelectContent>
												{bankAccounts.map((account: any) => (
													<SelectItem key={account.id} value={account.id}>
														{account.bankName} - {account.accountName}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{bankAccounts.length === 0 &&
											!ensureCashAccount.isPending && (
												<p className="text-muted-foreground text-xs">
													{ensureCashAccount.isError
														? "Failed to create cash account. Please create one in the Banking section."
														: "Creating default Cash account..."}
												</p>
											)}
										{ensureCashAccount.isPending && (
											<p className="text-muted-foreground text-xs">
												Setting up Cash account...
											</p>
										)}
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Type</FormLabel>
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
												<SelectItem value="deposit">
													Deposit (Income)
												</SelectItem>
												<SelectItem value="withdrawal">
													Withdrawal (Expense)
												</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="amount"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Amount</FormLabel>
										<FormControl>
											<Input
												placeholder="0.00"
												{...field}
												type="number"
												step="0.01"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
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
											<Input placeholder="e.g. Office Supplies" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="payeePayer"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Payee/Payer (Optional)</FormLabel>
										<FormControl>
											<Input placeholder="e.g. John Doe" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="referenceNumber"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Reference Number (Optional)</FormLabel>
										<FormControl>
											<Input placeholder="e.g. INV-001" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button
								type="submit"
								className="w-full"
								disabled={createTransaction.isPending}
							>
								{createTransaction.isPending
									? "Creating..."
									: "Create Transaction"}
							</Button>
						</form>
					</Form>
				</div>
			</SheetContent>
		</Sheet>
	);
}
