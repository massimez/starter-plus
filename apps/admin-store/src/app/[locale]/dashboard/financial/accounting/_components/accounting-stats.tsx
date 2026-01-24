"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { BookOpen, CheckCircle2, FileText, TrendingUp } from "lucide-react";
import { useFinancialAccounting } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-accounting";

export function AccountingStats() {
	const { useAccounts, useJournalEntries } = useFinancialAccounting();
	const { data: accounts, isLoading: accountsLoading } = useAccounts();
	const { data: entries, isLoading: entriesLoading } = useJournalEntries();

	const isLoading = accountsLoading || entriesLoading;

	const totalAccounts = accounts?.length ?? 0;
	const postedEntries =
		entries?.filter((e: { status: string }) => e.status === "posted").length ??
		0;
	const draftEntries =
		entries?.filter((e: { status: string }) => e.status === "draft").length ??
		0;
	const totalEntries = entries?.length ?? 0;

	if (isLoading) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{[...Array(4)].map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: <>
					<Card key={i}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-4 rounded" />
						</CardHeader>
						<CardContent>
							<Skeleton className="mb-1 h-8 w-16" />
							<Skeleton className="h-3 w-32" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card className="border-l-4 border-l-blue-500">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">
						Chart of Accounts
					</CardTitle>
					<BookOpen className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{totalAccounts}</div>
					<p className="text-muted-foreground text-xs">Active GL accounts</p>
				</CardContent>
			</Card>

			<Card className="border-l-4 border-l-green-500">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Posted Entries</CardTitle>
					<CheckCircle2 className="h-4 w-4 text-green-600" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{postedEntries}</div>
					<p className="text-muted-foreground text-xs">
						Finalized journal entries
					</p>
				</CardContent>
			</Card>

			<Card className="border-l-4 border-l-amber-500">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Draft Entries</CardTitle>
					<FileText className="h-4 w-4 text-amber-600" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{draftEntries}</div>
					<p className="text-muted-foreground text-xs">
						Pending review & approval
					</p>
				</CardContent>
			</Card>

			<Card className="border-l-4 border-l-purple-500">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Total Entries</CardTitle>
					<TrendingUp className="h-4 w-4 text-purple-600" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{totalEntries}</div>
					<p className="text-muted-foreground text-xs">All journal entries</p>
				</CardContent>
			</Card>
		</div>
	);
}
