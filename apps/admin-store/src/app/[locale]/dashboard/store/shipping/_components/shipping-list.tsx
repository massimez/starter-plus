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
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { ShippingMethod } from "./use-shipping";

interface ShippingListProps {
	shippingMethods: ShippingMethod[];
	locale: string;
	onDelete: (id: string) => Promise<void>;
}

export const ShippingList = ({
	shippingMethods,
	locale,
	onDelete,
}: ShippingListProps) => {
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const handleDeleteConfirm = async () => {
		if (deleteId) {
			await onDelete(deleteId);
			setDeleteId(null);
		}
	};

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Code</TableHead>
						<TableHead>Price</TableHead>
						<TableHead>Delivery Time</TableHead>
						<TableHead>Status</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{shippingMethods.length === 0 ? (
						<TableRow>
							<TableCell colSpan={6} className="h-24 text-center">
								No shipping methods found.
							</TableCell>
						</TableRow>
					) : (
						shippingMethods.map((method) => (
							<TableRow key={method.id}>
								<TableCell className="font-medium">
									{method.name}
									{method.isDefault && (
										<Badge variant="secondary" className="ml-2">
											Default
										</Badge>
									)}
								</TableCell>
								<TableCell>{method.code}</TableCell>
								<TableCell>
									{method.basePrice} {method.currency}
								</TableCell>
								<TableCell>
									{method.estimatedMinDays} - {method.estimatedMaxDays} days
								</TableCell>
								<TableCell>
									<Badge variant={method.isActive ? "primary" : "destructive"}>
										{method.isActive ? "Active" : "Inactive"}
									</Badge>
								</TableCell>
								<TableCell className="text-right">
									<div className="flex justify-end gap-2">
										<Link
											href={`/${locale}/dashboard/store/shipping/${method.id}`}
										>
											<Button variant="ghost" size="icon">
												<Edit className="h-4 w-4" />
											</Button>
										</Link>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => setDeleteId(method.id)}
										>
											<Trash2 className="h-4 w-4 text-destructive" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>

			<AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the
							shipping method.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};
