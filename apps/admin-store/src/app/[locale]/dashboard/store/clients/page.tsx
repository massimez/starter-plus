"use client";
import { Button } from "@workspace/ui/components/button";
import { useState } from "react";
import { PageDashboardHeader } from "@/app/[locale]/(landing)/_components/sections/page-dashboard-header";
import { ClientList } from "./_components/client-list";
import { ClientModal } from "./_components/client-modal";
import { useClients } from "./hooks";

const ClientsPage = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	// biome-ignore lint/suspicious/noExplicitAny: <>
	const [editingClient, setEditingClient] = useState<any>(null);

	const { data: clientsQueryResult, isLoading, error } = useClients();

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error: {error.message}</div>;

	return (
		<div className="p-4">
			<div className="mb-4 flex flex-col justify-between">
				<PageDashboardHeader title="Clients" />
				<div className="flex items-center gap-4">
					<Button onClick={() => setIsModalOpen(true)}>Add Client</Button>
				</div>
			</div>
			<ClientList
				clients={clientsQueryResult?.clients || []}
				onEditClient={(client) => {
					setEditingClient(client);
					setIsModalOpen(true);
				}}
			/>

			<ClientModal
				open={isModalOpen}
				onOpenChange={setIsModalOpen}
				editingClient={editingClient}
				onClose={() => setEditingClient(null)}
			/>
		</div>
	);
};

export default ClientsPage;
