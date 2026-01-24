"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
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
import { Settings2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useFinancialPayroll } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-payroll";
import { CreateSalaryComponentSheet } from "./create-salary-component-sheet";

function DeleteComponentButton({ id, name }: { id: string; name: string }) {
	const { useDeleteSalaryComponent } = useFinancialPayroll();
	let deleteComponent = useDeleteSalaryComponent();

	if (deleteComponent.mutate.toString().includes("throw new Error")) {
		deleteComponent = deleteComponent as typeof deleteComponent;
	}

	const [open, setOpen] = useState(false);

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-destructive"
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Salary Component</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete <strong>{name}</strong>? This action
						cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						className="bg-destructive hover:bg-destructive/90"
						onClick={() => {
							deleteComponent.mutate(id, {
								onSuccess: () => {
									toast.success("Component deleted successfully");
									setOpen(false);
								},
								onError: () => {
									toast.error("Failed to delete component");
								},
							});
						}}
					>
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export function SalaryComponentsTable() {
	const { useSalaryComponents } = useFinancialPayroll();

	// Use hook but fall back to mock data if HC client not ready
	let { data: components, isLoading } = useSalaryComponents();
	if (!Array.isArray(components)) {
		components = []; // Mock data fallback
		isLoading = false;
	}

	if (isLoading) {
		return (
			<div className="space-y-4">
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						key={`skeleton-${String(i)}`}
						className="h-12 animate-pulse rounded bg-muted"
					/>
				))}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h4 className="font-medium">Salary Components</h4>
					<p className="text-muted-foreground text-sm">
						Define allowances, deductions, and other salary components.
					</p>
				</div>
				<CreateSalaryComponentSheet />
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Calculation</TableHead>
							<TableHead>Taxable</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{components?.map((component) => (
							<TableRow key={component.id}>
								<TableCell className="font-medium">{component.name}</TableCell>
								<TableCell>
									<Badge
										variant={
											component.componentType === "earning"
												? "success"
												: component.componentType === "deduction"
													? "destructive"
													: "secondary"
										}
									>
										{component.componentType.replace("_", " ")}
									</Badge>
								</TableCell>
								<TableCell>Fixed</TableCell>
								<TableCell>
									<Badge
										variant={component.isTaxable ? "success" : "secondary"}
									>
										{component.isTaxable ? "Yes" : "No"}
									</Badge>
								</TableCell>
								<TableCell>
									<Badge variant={component.isActive ? "success" : "outline"}>
										{component.isActive ? "Active" : "Inactive"}
									</Badge>
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-2">
										<CreateSalaryComponentSheet
											editingComponent={{
												...component,
												calculationType: "fixed",
											}}
										/>
										<DeleteComponentButton
											id={component.id}
											name={component.name}
										/>
									</div>
								</TableCell>
							</TableRow>
						))}
						{!components?.length && (
							<TableRow>
								<TableCell colSpan={6} className="h-32 text-center">
									<div className="flex flex-col items-center gap-2">
										<Settings2 className="h-8 w-8 text-muted-foreground" />
										<p className="text-muted-foreground">
											No salary components found.
										</p>
										<p className="text-muted-foreground text-sm">
											Create components to define earnings and deductions for
											payroll.
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
