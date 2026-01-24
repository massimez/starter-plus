import { Separator } from "@workspace/ui/components/separator";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@workspace/ui/components/tabs";
import { CreatePayrollRunSheet } from "./_components/create-payroll-run-sheet";
import { CreateSalaryAdvanceSheet } from "./_components/create-salary-advance-sheet";
import { EmployeeTable } from "./_components/employee-table";
import { PayrollStats } from "./_components/payroll-stats";
import { PayrollTable } from "./_components/payroll-table";
import { SalaryAdvanceTable } from "./_components/salary-advance-table";
import { SalaryComponentsTable } from "./_components/salary-components-table";
import { SalaryStructuresTable } from "./_components/salary-structures-table";

export default function FinancialPayrollPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-medium text-lg">Payroll</h3>
					<p className="text-muted-foreground text-sm">
						Manage employees, salary components, and payroll runs.
					</p>
				</div>
			</div>

			<Separator />

			<PayrollStats />

			<Tabs defaultValue="employees" className="space-y-4">
				<div className="flex items-center justify-between">
					<TabsList>
						<TabsTrigger value="employees">Employees</TabsTrigger>
						<TabsTrigger value="salary-components">
							Salary Components
						</TabsTrigger>
						<TabsTrigger value="salary-structures">
							Salary Structures
						</TabsTrigger>
						<TabsTrigger value="salary-advances">Salary Advances</TabsTrigger>
						<TabsTrigger value="payroll-runs">Payroll Runs</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="employees" className="space-y-4">
					<EmployeeTable />
				</TabsContent>

				<TabsContent value="salary-components" className="space-y-4">
					<SalaryComponentsTable />
				</TabsContent>

				<TabsContent value="salary-advances" className="space-y-4">
					<div className="flex items-center justify-end">
						<CreateSalaryAdvanceSheet />
					</div>
					<SalaryAdvanceTable />
				</TabsContent>

				<TabsContent value="salary-structures" className="space-y-4">
					<SalaryStructuresTable />
				</TabsContent>

				<TabsContent value="payroll-runs" className="space-y-4">
					<div className="flex items-center justify-end">
						<CreatePayrollRunSheet />
					</div>
					<PayrollTable />
				</TabsContent>
			</Tabs>
		</div>
	);
}
