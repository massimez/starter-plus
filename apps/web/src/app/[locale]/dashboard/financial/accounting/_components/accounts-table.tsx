"use client";

import { Badge } from "@workspace/ui/components/badge";
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
import { FolderTree } from "lucide-react";
import { useFinancialAccounting } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-accounting";

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

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Chart of Accounts</CardTitle>
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
				<CardTitle>Chart of Accounts</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[100px]">Code</TableHead>
							<TableHead>Name</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Category</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{accounts?.map((account) => {
							const accountType =
								account.category?.accountType?.name?.toLowerCase() || "";
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
									<TableCell className="font-medium">{account.name}</TableCell>
									<TableCell>
										<Badge
											variant="outline"
											className={`capitalize ${colorClass}`}
										>
											{account.category?.accountType?.name?.replace("_", " ")}
										</Badge>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{account.category?.name}
									</TableCell>
								</TableRow>
							);
						})}
						{!accounts?.length && (
							<TableRow>
								<TableCell colSpan={4} className="h-32 text-center">
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
	);
}
