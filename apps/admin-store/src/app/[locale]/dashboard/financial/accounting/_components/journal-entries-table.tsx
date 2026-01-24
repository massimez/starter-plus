"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { DeleteConfirmationDialog } from "@workspace/ui/components/delete-confirmation-dialog";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { CheckCircle, ChevronDown, FileText, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useFinancialAccounting } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-accounting";
import { useCurrency } from "@/app/providers/currency-provider";
import { formatDate } from "@/lib/date";

interface JournalEntryLine {
	id: string;
	accountId: string;
	debitAmount: string;
	creditAmount: string;
	description?: string;
	account?: {
		code: string;
		name: string;
	};
}

interface JournalEntry {
	id: string;
	entryDate: string;
	entryNumber: string;
	description: string;
	status: string;
	lines?: JournalEntryLine[];
}

function JournalEntryRow({
	entry,
	isOpen,
	onToggle,
}: {
	entry: JournalEntry;
	isOpen: boolean;
	onToggle: () => void;
}) {
	const { usePostJournalEntry, useDeleteJournalEntry } =
		useFinancialAccounting();
	const postEntry = usePostJournalEntry();
	const deleteEntry = useDeleteJournalEntry();
	const { formatCurrency } = useCurrency();

	const totalDebit =
		entry.lines?.reduce((sum, line) => sum + Number(line.debitAmount), 0) ?? 0;
	const totalCredit =
		entry.lines?.reduce((sum, line) => sum + Number(line.creditAmount), 0) ?? 0;

	const handlePost = () => {
		postEntry.mutate(entry.id, {
			onSuccess: () => {
				toast.success("Journal entry posted successfully");
			},
			onError: (error: Error) => {
				toast.error(error.message || "Failed to post entry");
			},
		});
	};

	const handleDelete = () => {
		deleteEntry.mutate(entry.id, {
			onSuccess: () => {
				toast.success("Journal entry deleted successfully");
			},
			onError: (error: Error) => {
				toast.error(error.message || "Failed to delete entry");
			},
		});
	};

	return (
		<>
			<TableRow
				className="cursor-pointer transition-colors hover:bg-muted/50"
				onClick={onToggle}
			>
				<TableCell>
					<Button
						variant="ghost"
						size="sm"
						className="h-6 w-6 p-0"
						onClick={(e) => {
							e.stopPropagation();
							onToggle();
						}}
					>
						<ChevronDown
							className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
						/>
					</Button>
				</TableCell>
				<TableCell>{formatDate(entry.entryDate)}</TableCell>
				<TableCell className="font-medium font-mono">
					{entry.entryNumber}
				</TableCell>
				<TableCell className="max-w-[200px] truncate">
					{entry.description}
				</TableCell>
				<TableCell className="text-right font-medium text-green-600">
					{formatCurrency(totalDebit)}
				</TableCell>
				<TableCell className="text-right font-medium text-red-600">
					{formatCurrency(totalCredit)}
				</TableCell>
				<TableCell>
					<Badge
						variant={
							entry.status === "posted"
								? "success"
								: entry.status === "draft"
									? "secondary"
									: "outline"
						}
						className="capitalize"
					>
						{entry.status}
					</Badge>
				</TableCell>
				<TableCell>
					{entry.status === "draft" && (
						<div className="flex items-center gap-1">
							<Button
								variant="outline"
								size="sm"
								onClick={(e) => {
									e.stopPropagation();
									handlePost();
								}}
								disabled={postEntry.isPending}
								className="h-7 text-xs"
							>
								<CheckCircle className="mr-1 h-3 w-3" />
								Post
							</Button>
							<DeleteConfirmationDialog
								title="Delete Journal Entry"
								description={`Are you sure you want to delete entry ${entry.entryNumber}? This action cannot be undone.`}
								onConfirm={handleDelete}
								disabled={deleteEntry.isPending}
							>
								<Button
									variant="ghost"
									size="sm"
									onClick={(e) => e.stopPropagation()}
									disabled={deleteEntry.isPending}
									className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
								>
									<Trash2 className="h-3.5 w-3.5" />
								</Button>
							</DeleteConfirmationDialog>
						</div>
					)}
				</TableCell>
			</TableRow>
			{isOpen && (
				<TableRow className="bg-muted/30 hover:bg-muted/30">
					<TableCell colSpan={8} className="py-0">
						<div className="px-6 py-3">
							<p className="mb-2 font-medium text-muted-foreground text-xs">
								Line Details
							</p>
							<div className="rounded-md border bg-background">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="text-xs">Account</TableHead>
											<TableHead className="text-xs">Description</TableHead>
											<TableHead className="text-right text-xs">
												Debit
											</TableHead>
											<TableHead className="text-right text-xs">
												Credit
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{entry.lines?.map((line) => (
											<TableRow key={line.id}>
												<TableCell className="text-sm">
													<span className="font-mono text-muted-foreground">
														{line.account?.code}
													</span>{" "}
													{line.account?.name}
												</TableCell>
												<TableCell className="text-muted-foreground text-sm">
													{line.description || "-"}
												</TableCell>
												<TableCell className="text-right text-sm">
													{Number(line.debitAmount) > 0 && (
														<span className="text-green-600">
															{formatCurrency(Number(line.debitAmount))}
														</span>
													)}
												</TableCell>
												<TableCell className="text-right text-sm">
													{Number(line.creditAmount) > 0 && (
														<span className="text-red-600">
															{formatCurrency(Number(line.creditAmount))}
														</span>
													)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</div>
					</TableCell>
				</TableRow>
			)}
		</>
	);
}

export function JournalEntriesTable() {
	const { useJournalEntries } = useFinancialAccounting();
	const { data: entries, isLoading } = useJournalEntries();
	const [openRows, setOpenRows] = useState<Set<string>>(new Set());

	const toggleRow = (id: string) => {
		setOpenRows((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Journal Entries</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-full" />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Journal Entries</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-10" />
							<TableHead>Date</TableHead>
							<TableHead>Entry #</TableHead>
							<TableHead>Description</TableHead>
							<TableHead className="text-right">Debit</TableHead>
							<TableHead className="text-right">Credit</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="w-[120px]">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{(entries as JournalEntry[])?.map((entry) => (
							<JournalEntryRow
								key={entry.id}
								entry={entry}
								isOpen={openRows.has(entry.id)}
								onToggle={() => toggleRow(entry.id)}
							/>
						))}
						{!entries?.length && (
							<TableRow>
								<TableCell colSpan={8} className="h-32 text-center">
									<div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
										<FileText className="h-8 w-8" />
										<p className="font-medium">No journal entries found</p>
										<p className="text-sm">
											Create your first journal entry to get started
										</p>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
