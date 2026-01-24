"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@workspace/ui/components/badge";
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
import { AlertCircle, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { useFinancialAccounting } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-accounting";
import { useCurrency } from "@/app/providers/currency-provider";

const lineSchema = z.object({
	accountId: z.string().min(1, "Account is required"),
	debitAmount: z.string().default("0"),
	creditAmount: z.string().default("0"),
	description: z.string().optional(),
});

const formSchema = z.object({
	entryDate: z.string().min(1, "Date is required"),
	description: z.string().min(1, "Description is required"),
	lines: z.array(lineSchema).min(2, "At least 2 lines are required"),
});

function BalanceIndicator({
	control,
}: {
	control: import("react-hook-form").Control<z.infer<typeof formSchema>>;
}) {
	const lines = useWatch({ control, name: "lines" });
	const { formatCurrency } = useCurrency();

	const totalDebit = lines?.reduce(
		(sum: number, line: { debitAmount: string }) =>
			sum + Number(line.debitAmount || 0),
		0,
	);
	const totalCredit = lines?.reduce(
		(sum: number, line: { creditAmount: string }) =>
			sum + Number(line.creditAmount || 0),
		0,
	);

	const difference = Math.abs(totalDebit - totalCredit);
	const isBalanced = difference < 0.01 && totalDebit > 0;

	return (
		<div
			className={`flex items-center justify-between rounded-lg border p-3 ${
				isBalanced
					? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
					: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
			}`}
		>
			<div className="flex items-center gap-2">
				{isBalanced ? (
					<CheckCircle2 className="h-4 w-4 text-green-600" />
				) : (
					<AlertCircle className="h-4 w-4 text-amber-600" />
				)}
				<span className="font-medium text-sm">
					{isBalanced ? "Entry is balanced" : "Entry is not balanced"}
				</span>
			</div>
			<div className="flex items-center gap-4 text-sm">
				<div>
					<span className="text-muted-foreground">Debit: </span>
					<span className="font-medium text-green-600">
						{formatCurrency(totalDebit)}
					</span>
				</div>
				<div>
					<span className="text-muted-foreground">Credit: </span>
					<span className="font-medium text-red-600">
						{formatCurrency(totalCredit)}
					</span>
				</div>
				{!isBalanced && difference > 0 && (
					<Badge variant="outline" className="border-amber-300 text-amber-600">
						Diff: {formatCurrency(difference)}
					</Badge>
				)}
			</div>
		</div>
	);
}

export function CreateJournalEntrySheet() {
	const [open, setOpen] = useState(false);
	const { useCreateJournalEntry, useAccounts } = useFinancialAccounting();
	const createEntry = useCreateJournalEntry();
	const { data: accounts } = useAccounts();

	const form = useForm<z.infer<typeof formSchema>>({
		// biome-ignore lint/suspicious/noExplicitAny: pragmatic fix for hookform resolver mismatch
		resolver: zodResolver(formSchema) as any,
		defaultValues: {
			entryDate: new Date().toISOString().split("T")[0],
			description: "",
			lines: [
				{ accountId: "", debitAmount: "", creditAmount: "", description: "" },
				{ accountId: "", debitAmount: "", creditAmount: "", description: "" },
			],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "lines",
	});

	// Handle debit/credit mutual exclusivity
	const handleDebitChange = (index: number, value: string) => {
		form.setValue(`lines.${index}.debitAmount`, value);
		// Clear credit if debit has value
		if (value && Number(value) > 0) {
			form.setValue(`lines.${index}.creditAmount`, "0");
		}
	};

	const handleCreditChange = (index: number, value: string) => {
		form.setValue(`lines.${index}.creditAmount`, value);
		// Clear debit if credit has value
		if (value && Number(value) > 0) {
			form.setValue(`lines.${index}.debitAmount`, "0");
		}
	};

	function onSubmit(values: z.infer<typeof formSchema>) {
		const totalDebit = values.lines.reduce(
			(sum, line) => sum + Number(line.debitAmount || 0),
			0,
		);
		const totalCredit = values.lines.reduce(
			(sum, line) => sum + Number(line.creditAmount || 0),
			0,
		);

		if (Math.abs(totalDebit - totalCredit) > 0.01) {
			toast.error("Journal entry must be balanced (Debits = Credits)");
			return;
		}

		if (totalDebit === 0) {
			toast.error("Journal entry must have at least one debit and one credit");
			return;
		}

		// Validate each line has either debit or credit, not both
		for (let i = 0; i < values.lines.length; i++) {
			const line = values.lines[i];
			if (!line) continue;
			const debit = Number(line.debitAmount || 0);
			const credit = Number(line.creditAmount || 0);

			if (debit > 0 && credit > 0) {
				toast.error(
					`Line ${i + 1}: Each line must have either a debit OR a credit, not both`,
				);
				return;
			}
			if (debit === 0 && credit === 0) {
				toast.error(
					`Line ${i + 1}: Each line must have a debit or credit amount`,
				);
				return;
			}
		}

		// Normalize amounts - ensure empty strings become "0"
		const normalizedLines = values.lines.map((line) => ({
			...line,
			debitAmount: line.debitAmount || "0",
			creditAmount: line.creditAmount || "0",
		}));

		createEntry.mutate(
			{
				entryDate: new Date(values.entryDate).toISOString(),
				description: values.description,
				lines: normalizedLines,
			},
			{
				onSuccess: () => {
					toast.success("Journal entry created successfully");
					setOpen(false);
					form.reset();
				},
				onError: (error: Error) => {
					toast.error(error.message || "Failed to create journal entry");
				},
			},
		);
	}

	// Group accounts by type for better organization
	const groupedAccounts = accounts?.reduce(
		(
			groups: Record<
				string,
				Array<{
					id: string;
					code: string;
					name: string;
					category?: string | null;
					accountType: string;
				}>
			>,
			account,
		) => {
			const type = account.accountType || "Other";
			if (!groups[type]) {
				groups[type] = [];
			}
			groups[type].push(account);
			return groups;
		},
		{},
	);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					New Entry
				</Button>
			</SheetTrigger>
			<SheetContent className="overflow-y-auto sm:max-w-[600px]">
				<SheetHeader>
					<SheetTitle>New Journal Entry</SheetTitle>
					<SheetDescription>
						Create a manual journal entry. Each line must have either a debit OR
						a credit (not both). Total debits must equal total credits.
					</SheetDescription>
				</SheetHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4 py-4"
					>
						<BalanceIndicator control={form.control} />

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="entryDate"
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
											<Input {...field} placeholder="Entry description" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<FormLabel>Lines</FormLabel>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										append({
											accountId: "",
											debitAmount: "",
											creditAmount: "",
											description: "",
										})
									}
								>
									<Plus className="mr-1 h-3 w-3" />
									Add Line
								</Button>
							</div>

							<p className="text-muted-foreground text-xs">
								💡 Tip: Each line should have either a Debit OR Credit value,
								not both.
							</p>

							{fields.map((field, index) => (
								<div
									key={field.id}
									className={`grid grid-cols-12 items-end gap-2 rounded-md border p-3 ${
										index % 2 === 0 ? "bg-muted/30" : "bg-background"
									}`}
								>
									<div className="col-span-12">
										<FormField
											control={form.control}
											name={`lines.${index}.accountId`}
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-xs">Account</FormLabel>
													<Select
														onValueChange={field.onChange}
														defaultValue={field.value}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select account" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{groupedAccounts &&
																Object.entries(groupedAccounts).map(
																	([type, accts]) => (
																		<div key={type}>
																			<div className="px-2 py-1.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
																				{type.replace("_", " ")}
																			</div>
																			{accts.map(
																				(acc: {
																					id: string;
																					code: string;
																					name: string;
																				}) => (
																					<SelectItem
																						key={acc.id}
																						value={acc.id}
																					>
																						<span className="font-mono text-muted-foreground">
																							{acc.code}
																						</span>{" "}
																						{acc.name}
																					</SelectItem>
																				),
																			)}
																		</div>
																	),
																)}
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
									<div className="col-span-5">
										<FormField
											control={form.control}
											name={`lines.${index}.debitAmount`}
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-green-600 text-xs">
														Debit
													</FormLabel>
													<FormControl>
														<Input
															type="number"
															step="0.01"
															min="0"
															placeholder="0.00"
															className="border-green-200 focus:border-green-400"
															{...field}
															onChange={(e) =>
																handleDebitChange(index, e.target.value)
															}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
									<div className="col-span-5">
										<FormField
											control={form.control}
											name={`lines.${index}.creditAmount`}
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-red-600 text-xs">
														Credit
													</FormLabel>
													<FormControl>
														<Input
															type="number"
															step="0.01"
															min="0"
															placeholder="0.00"
															className="border-red-200 focus:border-red-400"
															{...field}
															onChange={(e) =>
																handleCreditChange(index, e.target.value)
															}
														/>
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
											disabled={fields.length <= 2}
											className="hover:bg-destructive/10"
										>
											<Trash2 className="h-4 w-4 text-destructive" />
										</Button>
									</div>
								</div>
							))}
							<FormMessage>
								{form.formState.errors.lines?.root?.message}
							</FormMessage>
						</div>

						<Button
							type="submit"
							className="w-full"
							disabled={createEntry.isPending}
						>
							{createEntry.isPending ? "Creating..." : "Create Entry"}
						</Button>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}
