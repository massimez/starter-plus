"use client";

import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { DeleteConfirmationDialog } from "@workspace/ui/components/delete-confirmation-dialog";
import { toast } from "sonner";
import { AdvancedSettingsForm } from "./forms/advanced-settings-form";
import { useActiveOrganization, useDeleteOrganization } from "./queries";

function DeleteOrganization() {
	const { activeOrganization } = useActiveOrganization();
	const { mutateAsync: deleteOrganization, isPending } =
		useDeleteOrganization();

	const handleDelete = async () => {
		if (!activeOrganization?.id) return;

		try {
			await deleteOrganization({ organizationId: activeOrganization.id });
			toast.success("Organization deleted successfully");
			// Hard refresh to trigger organization guard and redirect to appropriate page
			window.location.href = "/";
		} catch (error) {
			console.error("Failed to delete organization:", error);
			toast.error("Failed to delete organization");
		}
	};

	if (!activeOrganization) return null;

	return (
		<Card className="border-destructive/50">
			<CardHeader>
				<CardTitle className="text-destructive">Danger Zone</CardTitle>
				<CardDescription>
					Irreversible and destructive actions for your organization
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
					<div className="space-y-1">
						<p className="font-medium text-sm">Delete Organization</p>
						<p className="text-muted-foreground text-sm">
							Permanently delete your organization and all of its data. This
							action cannot be undone.
						</p>
					</div>
					<DeleteConfirmationDialog
						onConfirm={handleDelete}
						title="Delete Organization"
						description={`Are you sure you want to delete ${activeOrganization?.name}? This action cannot be undone and will permanently delete all data associated with this organization.`}
					>
						<Button variant="destructive" disabled={isPending}>
							{isPending ? "Deleting..." : "Delete Organization"}
						</Button>
					</DeleteConfirmationDialog>
				</div>
			</CardContent>
		</Card>
	);
}

export default function OrganizationAdvancedTab() {
	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Advanced Settings</CardTitle>
					<CardDescription>
						Manage organization advanced settings
					</CardDescription>
				</CardHeader>
				<CardContent>
					<AdvancedSettingsForm />
				</CardContent>
			</Card>
			<DeleteOrganization />
		</div>
	);
}
