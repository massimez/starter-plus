"use client";

import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardTitle } from "@workspace/ui/components/card";
import { DeleteDropdownMenuItem } from "@workspace/ui/components/delete-confirmation-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { MoreHorizontal, Truck } from "lucide-react";
import { useState } from "react";
import { useDeleteSupplier } from "../hooks";

interface Supplier {
	id: string;
	name: string;
	email?: string | null;
	phone?: string | null;
	city?: string | null;
	country?: string | null;
	contactPerson?: string | null;
	createdAt: string;
	address: {
		building?: string | null;
		office?: string | null;
		street?: string | null;
		city?: string | null;
		state?: string | null;
		zipCode?: string | null;
		country?: string | null;
	} | null;
}

interface SupplierListProps {
	suppliers: Supplier[];
	onEditSupplier?: (supplier: Supplier) => void;
}

export const SupplierList = ({
	suppliers,
	onEditSupplier,
}: SupplierListProps) => {
	const [searchTerm, setSearchTerm] = useState("");

	const { deleteSupplier, isDeletingSupplier } = useDeleteSupplier();

	const filteredSuppliers = suppliers.filter(
		(supplier) =>
			supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			supplier.contactPerson
				?.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			supplier.id.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const handleDeleteClick = (supplierId: string) => {
		deleteSupplier(supplierId);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4">
				<Input
					placeholder="Search suppliers by name, email, contact person, or ID..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="max-w-md"
				/>
				<p className="whitespace-nowrap text-muted-foreground text-sm">
					{filteredSuppliers.length}{" "}
					{filteredSuppliers.length === 1 ? "supplier" : "suppliers"}
				</p>
			</div>

			{filteredSuppliers.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12 text-center">
						<Truck className="mb-4 h-12 w-12 text-muted-foreground" />
						<CardTitle className="mb-2">No suppliers found</CardTitle>
						<p className="text-muted-foreground text-sm">
							{searchTerm
								? "Try adjusting your search terms"
								: "Get started by creating your first supplier"}
						</p>
					</CardContent>
				</Card>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Contact Person</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Phone</TableHead>
							<TableHead>Location</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredSuppliers.map((supplier) => (
							<TableRow key={supplier.id}>
								<TableCell className="font-medium">{supplier.name}</TableCell>
								<TableCell>{supplier.contactPerson || "-"}</TableCell>
								<TableCell>{supplier.email || "-"}</TableCell>
								<TableCell>{supplier.phone || "-"}</TableCell>
								<TableCell>
									{[supplier.city, supplier.country]
										.filter(Boolean)
										.join(", ") || "-"}
								</TableCell>
								<TableCell>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" className="h-8 w-8 p-0">
												<span className="sr-only">Open menu</span>
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={() => onEditSupplier?.(supplier)}
											>
												Edit
											</DropdownMenuItem>
											<DeleteDropdownMenuItem
												onConfirm={() => handleDeleteClick(supplier.id)}
												disabled={isDeletingSupplier}
												description="This action cannot be undone. This will permanently delete the supplier."
											/>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
};
