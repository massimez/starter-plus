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
import type { ShippingZone } from "./use-zones";

interface ZoneListProps {
	zones: ShippingZone[];
	locale: string;
	onDelete: (id: string) => Promise<void>;
}

export const ZoneList = ({ zones, locale, onDelete }: ZoneListProps) => {
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
						<TableHead>Countries</TableHead>
						<TableHead>States</TableHead>
						<TableHead>Cities</TableHead>
						<TableHead>Status</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{zones.length === 0 ? (
						<TableRow>
							<TableCell colSpan={7} className="h-24 text-center">
								No shipping zones found.
							</TableCell>
						</TableRow>
					) : (
						zones.map((zone) => (
							<TableRow key={zone.id}>
								<TableCell className="font-medium">{zone.name}</TableCell>
								<TableCell>{zone.code}</TableCell>
								<TableCell>
									{zone.countries?.length
										? zone.countries.join(", ")
										: "All Countries"}
								</TableCell>
								<TableCell>
									{zone.states?.length ? zone.states.join(", ") : "-"}
								</TableCell>
								<TableCell>
									{zone.cities?.length ? zone.cities.join(", ") : "-"}
								</TableCell>
								<TableCell>
									<Badge variant={zone.isActive ? "primary" : "destructive"}>
										{zone.isActive ? "Active" : "Inactive"}
									</Badge>
								</TableCell>
								<TableCell className="text-right">
									<div className="flex justify-end gap-2">
										<Link
											href={`/${locale}/dashboard/store/shipping/zones/${zone.id}`}
										>
											<Button variant="ghost" size="icon">
												<Edit className="h-4 w-4" />
											</Button>
										</Link>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => setDeleteId(zone.id)}
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
							shipping zone.
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
