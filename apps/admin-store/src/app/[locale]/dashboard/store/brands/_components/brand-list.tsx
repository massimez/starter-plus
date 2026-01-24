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
import { MoreHorizontal, Tag } from "lucide-react";
import { useState } from "react";
import { useDeleteBrand } from "../hooks";

interface Brand {
	id: string;
	name: string;
	companyName?: string | null;
	logo?: string | null;
	website?: string | null;
	description?: string | null;
	isActive: boolean;
	createdAt: string;
}

interface BrandListProps {
	brands: Brand[];
	onEditBrand?: (brand: Brand) => void;
}

export const BrandList = ({ brands, onEditBrand }: BrandListProps) => {
	const [searchTerm, setSearchTerm] = useState("");

	const { deleteBrand, isDeletingBrand } = useDeleteBrand();

	const filteredBrands = brands.filter(
		(brand) =>
			brand.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			brand.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			brand.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			brand.id.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const handleDeleteClick = (brandId: string) => {
		deleteBrand(brandId);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4">
				<Input
					placeholder="Search brands by name, company name, description, or ID..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="max-w-md"
				/>
				<p className="whitespace-nowrap text-muted-foreground text-sm">
					{filteredBrands.length}{" "}
					{filteredBrands.length === 1 ? "brand" : "brands"}
				</p>
			</div>

			{filteredBrands.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12 text-center">
						<Tag className="mb-4 h-12 w-12 text-muted-foreground" />
						<CardTitle className="mb-2">No brands found</CardTitle>
						<p className="text-muted-foreground text-sm">
							{searchTerm
								? "Try adjusting your search terms"
								: "Get started by creating your first brand"}
						</p>
					</CardContent>
				</Card>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Company Name</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Website</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredBrands.map((brand) => (
							<TableRow key={brand.id}>
								<TableCell className="font-medium">{brand.name}</TableCell>
								<TableCell>{brand.companyName || "-"}</TableCell>
								<TableCell>
									{brand.description
										? brand.description.length > 50
											? `${brand.description.substring(0, 50)}...`
											: brand.description
										: "-"}
								</TableCell>
								<TableCell>
									{brand.website ? (
										<a
											href={brand.website}
											target="_blank"
											rel="noopener noreferrer"
											className="text-blue-600 hover:underline"
										>
											{brand.website}
										</a>
									) : (
										"-"
									)}
								</TableCell>
								<TableCell>
									<span
										className={`rounded-full px-2 py-1 text-xs ${
											brand.isActive
												? "bg-green-100 text-green-800"
												: "bg-red-100 text-red-800"
										}`}
									>
										{brand.isActive ? "Active" : "Inactive"}
									</span>
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
											<DropdownMenuItem onClick={() => onEditBrand?.(brand)}>
												Edit
											</DropdownMenuItem>
											<DeleteDropdownMenuItem
												onConfirm={() => handleDeleteClick(brand.id)}
												disabled={isDeletingBrand}
												description="This action cannot be undone. This will permanently delete the brand."
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
