import { Separator } from "@workspace/ui/components/separator";
import { FinancialExpensesList } from "../_components/financial-expenses-list";
import { CreateExpenseCategorySheet } from "./_components/create-expense-category-sheet";
import { CreateExpenseSheet } from "./_components/create-expense-sheet";
import { ExpenseStats } from "./_components/expense-stats";
import { ExpensesTable } from "./_components/expenses-table";

export default function FinancialExpensesPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-medium text-lg">Expenses</h3>
					<p className="text-muted-foreground text-sm">
						Track employee expenses and direct costs.
					</p>
				</div>
				<div className="flex gap-2">
					<CreateExpenseCategorySheet />
					<CreateExpenseSheet />
				</div>
			</div>
			<ExpenseStats />
			<Separator />
			<FinancialExpensesList table={ExpensesTable} />
		</div>
	);
}
