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
import { MoreHorizontal, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCurrency } from "@/app/providers/currency-provider";
import { useDeleteClient } from "../hooks";

interface Client {
	id: string;
	firstName?: string | null;
	lastName?: string | null;
	email?: string | null;
	phone?: string | null;
	totalOrders?: number | null;
	totalSpent?: string | null;
	lastPurchaseDate?: string | null;
	isActive?: boolean | null;
	createdAt: string;
}

interface ClientListProps {
	clients: Client[];
	onEditClient?: (client: Client) => void;
}

export const ClientList = ({ clients, onEditClient }: ClientListProps) => {
	const [searchTerm, setSearchTerm] = useState("");
	const router = useRouter();

	const { deleteClient, isDeletingClient } = useDeleteClient();

	const filteredClients = clients.filter(
		(client) =>
			client.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			client.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			client.id.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const handleDeleteClick = (clientId: string) => {
		deleteClient(clientId);
	};

	const { formatCurrency } = useCurrency();

	const formatDate = (date?: string | null) => {
		if (!date) return "-";
		return new Date(date).toLocaleDateString();
	};

	const getFullName = (client: Client) => {
		const parts = [client.firstName, client.lastName].filter(Boolean);
		return parts.length > 0 ? parts.join(" ") : "-";
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4">
				<Input
					placeholder="Search clients by name, email, or ID..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="max-w-md"
				/>
				<p className="whitespace-nowrap text-muted-foreground text-sm">
					{filteredClients.length}{" "}
					{filteredClients.length === 1 ? "client" : "clients"}
				</p>
			</div>

			{filteredClients.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12 text-center">
						<Users className="mb-4 h-12 w-12 text-muted-foreground" />
						<CardTitle className="mb-2">No clients found</CardTitle>
						<p className="text-muted-foreground text-sm">
							{searchTerm
								? "Try adjusting your search terms"
								: "Get started by creating your first client"}
						</p>
					</CardContent>
				</Card>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Phone</TableHead>
							<TableHead>Total Orders</TableHead>
							<TableHead>Total Spent</TableHead>
							<TableHead>Last Purchase</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredClients.map((client) => (
							<TableRow
								key={client.id}
								className="cursor-pointer hover:bg-muted/50"
								onClick={() =>
									router.push(`/en/dashboard/store/clients/${client.id}`)
								}
							>
								<TableCell className="font-medium">
									{getFullName(client)}
								</TableCell>
								<TableCell>{client.email || "-"}</TableCell>
								<TableCell>{client.phone || "-"}</TableCell>
								<TableCell>{client.totalOrders ?? 0}</TableCell>
								<TableCell>
									{formatCurrency(Number(client.totalSpent))}
								</TableCell>
								<TableCell>{formatDate(client.lastPurchaseDate)}</TableCell>
								<TableCell>
									{client.isActive ? (
										<span className="text-green-600">Active</span>
									) : (
										<span className="text-muted-foreground">Inactive</span>
									)}
								</TableCell>
								<TableCell onClick={(e) => e.stopPropagation()}>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" className="h-8 w-8 p-0">
												<span className="sr-only">Open menu</span>
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem onClick={() => onEditClient?.(client)}>
												Edit
											</DropdownMenuItem>
											<DeleteDropdownMenuItem
												onConfirm={() => handleDeleteClick(client.id)}
												disabled={isDeletingClient}
												description="This action cannot be undone. This will permanently delete the client."
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
