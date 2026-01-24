import { Separator } from "@workspace/ui/components/separator";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@workspace/ui/components/tabs";
import { AccountingStats } from "./_components/accounting-stats";
import { AccountsTable } from "./_components/accounts-table";
import { CreateJournalEntrySheet } from "./_components/create-journal-entry-sheet";
import { JournalEntriesTable } from "./_components/journal-entries-table";
import { TrialBalanceReport } from "./_components/trial-balance-report";

export default function FinancialAccountingPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-medium text-lg">Accounting</h3>
					<p className="text-muted-foreground text-sm">
						Manage chart of accounts, journal entries, and financial reports.
					</p>
				</div>
			</div>

			<Separator />

			<AccountingStats />

			<Tabs defaultValue="journal-entries" className="space-y-4">
				<TabsList>
					<TabsTrigger value="journal-entries">Journal Entries</TabsTrigger>
					<TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
					<TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
				</TabsList>

				<TabsContent value="journal-entries" className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h4 className="font-medium text-sm">Recent Journal Entries</h4>
							<p className="text-muted-foreground text-xs">
								View and manage journal entries
							</p>
						</div>
						<CreateJournalEntrySheet />
					</div>
					<JournalEntriesTable />
				</TabsContent>

				<TabsContent value="accounts" className="space-y-4">
					<AccountsTable />
				</TabsContent>

				<TabsContent value="trial-balance" className="space-y-4">
					<TrialBalanceReport />
				</TabsContent>
			</Tabs>
		</div>
	);
}
