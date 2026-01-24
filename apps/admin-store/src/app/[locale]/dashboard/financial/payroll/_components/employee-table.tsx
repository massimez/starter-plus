"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { Users } from "lucide-react";
import { useState } from "react";
import { useFinancialPayroll } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-payroll";
import { CreateEmployeeSheet } from "./create-employee-sheet";
import { EditEmployeeSheet } from "./edit-employee-sheet";

export function EmployeeTable() {
	const { useEmployees } = useFinancialPayroll();
	const { data: employees, isLoading } = useEmployees();
	// biome-ignore lint/suspicious/noExplicitAny: <>
	const [editingEmployee, setEditingEmployee] = useState<any>(null);

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
		<>
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<h4 className="font-medium">Employees</h4>
						<p className="text-muted-foreground text-sm">
							Manage your organization's employees and their payroll details.
						</p>
					</div>
					<CreateEmployeeSheet />
				</div>

				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Employee Code</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Position</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Hire Date</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{employees?.map((employee) => (
								<TableRow key={employee.id}>
									<TableCell className="font-medium">
										{employee.employeeCode}
									</TableCell>
									<TableCell>
										{employee.firstName} {employee.lastName}
									</TableCell>
									<TableCell>{employee.position || "-"}</TableCell>
									<TableCell>
										<Badge variant="outline" className="capitalize">
											{employee.employmentType.replace("_", " ")}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge
											variant={
												employee.status === "active"
													? "success"
													: employee.status === "on_leave"
														? "secondary"
														: "outline"
											}
										>
											{employee.status.replace("_", " ")}
										</Badge>
									</TableCell>
									<TableCell>
										{new Date(employee.hireDate).toLocaleDateString()}
									</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												setEditingEmployee({
													...employee,
													email: employee.email || undefined,
													phone: employee.phone || undefined,
													position: employee.position || undefined,
													bankAccountNumber:
														employee.bankAccountNumber || undefined,
													taxId: employee.taxId || undefined,
												})
											}
										>
											Edit
										</Button>
									</TableCell>
								</TableRow>
							))}
							{!employees?.length && (
								<TableRow>
									<TableCell colSpan={7} className="h-32 text-center">
										<div className="flex flex-col items-center gap-2">
											<Users className="h-8 w-8 text-muted-foreground" />
											<p className="text-muted-foreground">
												No employees found.
											</p>
											<p className="text-muted-foreground text-sm">
												Create your first employee to get started with payroll.
											</p>
										</div>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>
			{editingEmployee && (
				<EditEmployeeSheet
					employee={editingEmployee}
					open={!!editingEmployee}
					onOpenChange={(open) => (!open ? setEditingEmployee(null) : null)}
				/>
			)}
		</>
	);
}
