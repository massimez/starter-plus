"use client";

import { Card, CardContent, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { Package, Search } from "lucide-react";
import { useState } from "react";
import { useBatches } from "../hooks/use-batches";

interface BatchesListProps {
	productVariantId?: string;
}

export const BatchesList = ({ productVariantId }: BatchesListProps) => {
	const [searchTerm, setSearchTerm] = useState("");

	const {
		data: batchesResponse,
		isLoading,
		error,
	} = useBatches(productVariantId || "");

	const batches = batchesResponse?.data || [];

	const filteredBatches = batches.filter(
		(batch) =>
			batch.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			batch.id.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	if (isLoading) return <div>Loading batches...</div>;
	if (error) return <div>Error loading batches: {error.message}</div>;

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4">
				<Input
					placeholder="Search batches by number or ID..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="max-w-md"
				/>
				<p className="whitespace-nowrap text-muted-foreground text-sm">
					{filteredBatches.length}{" "}
					{filteredBatches.length === 1 ? "batch" : "batches"}
				</p>
			</div>

			{filteredBatches.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12 text-center">
						<Package className="mb-4 h-12 w-12 text-muted-foreground" />
						<CardTitle className="mb-2">No batches found</CardTitle>
						<p className="text-muted-foreground text-sm">
							{searchTerm
								? "Try adjusting your search terms"
								: "No batches exist for this variant"}
						</p>
					</CardContent>
				</Card>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Batch Number</TableHead>
							<TableHead>Quantity</TableHead>
							<TableHead>Location</TableHead>
							<TableHead>Expiry Date</TableHead>
							<TableHead>Created</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredBatches.map((batch) => (
							<TableRow key={batch.id}>
								<TableCell className="font-medium">
									{batch.batchNumber || "N/A"}
								</TableCell>
								<TableCell>{batch.quantity || 0}</TableCell>
								<TableCell>{batch.locationId || "N/A"}</TableCell>
								<TableCell>
									{batch.expiryDate
										? new Date(batch.expiryDate).toLocaleDateString()
										: "No expiry"}
								</TableCell>
								<TableCell>
									{batch.createdAt
										? new Date(batch.createdAt).toLocaleDateString()
										: "Unknown"}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
};
