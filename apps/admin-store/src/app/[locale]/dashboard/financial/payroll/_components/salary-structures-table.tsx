"use client";

import { Badge } from "@workspace/ui/components/badge";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { User } from "lucide-react";
import { useFinancialPayroll } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-payroll";
import { formatCurrency } from "@/lib/helpers";
import { CreateSalaryStructureSheet } from "./create-salary-structure-sheet";

interface SalaryStructure {
	id: string;
	employee: {
		firstName: string;
		lastName: string;
		employeeCode: string;
	};
	baseSalary: number;
	currency: string;
	paymentFrequency: string;
	effectiveFrom: string;
	isActive: boolean;
}

export function SalaryStructuresTable() {
	const { useSalaryStructures } = useFinancialPayroll();
	const { data: salaryStructures, isLoading } = useSalaryStructures();

	if (isLoading) {
		return (
			<div className="space-y-4">
				{[
					"skeleton-1",
					"skeleton-2",
					"skeleton-3",
					"skeleton-4",
					"skeleton-5",
				].map((key) => (
					<div key={key} className="h-12 animate-pulse rounded bg-muted" />
				))}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h4 className="font-medium">Salary Structures</h4>
					<p className="text-muted-foreground text-sm">
						Manage employee salaries and compensation packages.
					</p>
				</div>
				<CreateSalaryStructureSheet />
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Employee</TableHead>
							<TableHead>Code</TableHead>
							<TableHead>Base Salary</TableHead>
							<TableHead>Payment Frequency</TableHead>
							<TableHead>Effective Date</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{salaryStructures?.map((structure: SalaryStructure) => (
							<TableRow key={structure.id}>
								<TableCell className="font-medium">
									{structure.employee.firstName} {structure.employee.lastName}
								</TableCell>
								<TableCell>{structure.employee.employeeCode}</TableCell>
								<TableCell>
									<div className="flex items-center gap-1">
										{formatCurrency(
											Number(structure.baseSalary),
											structure.currency,
										)}
									</div>
								</TableCell>
								<TableCell>
									<Badge variant="secondary">
										{structure.paymentFrequency?.replace("_", " ")}
									</Badge>
								</TableCell>
								<TableCell>
									{new Date(structure.effectiveFrom).toLocaleDateString()}
								</TableCell>
								<TableCell>
									<Badge variant={structure.isActive ? "success" : "secondary"}>
										{structure.isActive ? "Active" : "Inactive"}
									</Badge>
								</TableCell>
								<TableCell>
									<CreateSalaryStructureSheet editingStructure={structure} />
								</TableCell>
							</TableRow>
						))}
						{!salaryStructures?.length && (
							<TableRow>
								<TableCell colSpan={8} className="h-32 text-center">
									<div className="flex flex-col items-center gap-2">
										<User className="h-8 w-8 text-muted-foreground" />
										<p className="text-muted-foreground">
											No salary structures found.
										</p>
										<p className="text-muted-foreground text-sm">
											Create salary structures to define employee compensation.
										</p>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
