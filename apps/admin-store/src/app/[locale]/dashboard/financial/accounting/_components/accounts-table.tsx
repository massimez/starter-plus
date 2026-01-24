"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { FolderTree, Pencil } from "lucide-react";
import { useState } from "react";
import { useFinancialAccounting } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-accounting";
import { CreateAccountSheet } from "./create-account-sheet";
import { EditAccountDialog } from "./edit-account-dialog";

const accountTypeColors: Record<string, string> = {
	asset: "bg-blue-500/10 text-blue-700 border-blue-200",
	liability: "bg-red-500/10 text-red-700 border-red-200",
	equity: "bg-purple-500/10 text-purple-700 border-purple-200",
	revenue: "bg-green-500/10 text-green-700 border-green-200",
	expense: "bg-amber-500/10 text-amber-700 border-amber-200",
};

export function AccountsTable() {
	const { useAccounts } = useFinancialAccounting();
	const { data: accounts, isLoading } = useAccounts();
	// biome-ignore lint/suspicious/noExplicitAny: <>
	const [editingAccount, setEditingAccount] = useState<any>(null);

	if (isLoading) {
		return (
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0">
					<CardTitle>Chart of Accounts</CardTitle>
					<Skeleton className="h-10 w-32" />
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
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0">
					<CardTitle>Chart of Accounts</CardTitle>
					<CreateAccountSheet />
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[100px]">Code</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Category</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{accounts?.map((account) => {
								const accountType = account.accountType?.toLowerCase() || "";
								const colorClass =
									accountTypeColors[accountType] || "bg-gray-100 text-gray-700";

								return (
									<TableRow
										key={account.id}
										className="transition-colors hover:bg-muted/50"
									>
										<TableCell className="font-medium font-mono">
											{account.code}
										</TableCell>
										<TableCell className="font-medium">
											{account.name}
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={`capitalize ${colorClass}`}
											>
												{account.accountType?.replace("_", " ")}
											</Badge>
										</TableCell>
										<TableCell className="text-muted-foreground">
											{account.category || "-"}
										</TableCell>
										<TableCell className="text-right">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => setEditingAccount(account)}
											>
												<Pencil className="h-4 w-4" />
											</Button>
										</TableCell>
									</TableRow>
								);
							})}
							{!accounts?.length && (
								<TableRow>
									<TableCell colSpan={5} className="h-32 text-center">
										<div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
											<FolderTree className="h-8 w-8" />
											<p className="font-medium">No accounts found</p>
											<p className="text-sm">
												Create your first GL account to get started
											</p>
										</div>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{editingAccount && (
				<EditAccountDialog
					account={editingAccount}
					open={!!editingAccount}
					onOpenChange={(open) => !open && setEditingAccount(null)}
				/>
			)}
		</>
	);
}
