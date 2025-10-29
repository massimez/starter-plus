"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { InsertLocation } from "@workspace/server/hc";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Separator } from "@workspace/ui/components/separator";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { LocationFormValues } from "@/app/[lang]/dashboard/organization/forms/location-form";
import { LocationForm } from "@/app/[lang]/dashboard/organization/forms/location-form";
import { useGetLocations } from "@/app/[lang]/dashboard/organization/queries";
import { hc } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { showError } from "@/lib/error-utils";

type EditableLocation = LocationFormValues & {
	id: string;
};

export default function OrganizationLocationsTab() {
	const searchParams = useSearchParams();
	const activeOrg = authClient.useActiveOrganization();
	const organizationId = activeOrg.data?.id || "";
	if (!organizationId) {
		console.error("No Organization Id provided", searchParams);
	}

	const queryClient = useQueryClient();
	const { data: locations, isLoading, error } = useGetLocations(organizationId);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [editingLocation, setEditingLocation] =
		useState<EditableLocation | null>(null);

	if (error) {
		showError(error, "Failed to fetch locations");
		return <p>Error loading locations.</p>;
	}

	const handleAddLocation = async (values: LocationFormValues) => {
		setIsSubmitting(true);
		try {
			const res = await hc.api.organizations.locations.$post({
				json: { ...values, organizationId } as InsertLocation,
			});
			if (res.ok) {
				toast.success("Location created successfully");
				setIsAddModalOpen(false);
				queryClient.invalidateQueries({
					queryKey: ["organization", organizationId, "locations"],
				});
			} else {
				const errorData = await res.json();
				showError(errorData, "Failed to create location");
			}
		} catch (error) {
			console.error("Error creating location:", error);
			showError(error, "Failed to create location");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEditLocation = async (values: LocationFormValues) => {
		if (!editingLocation) return;

		setIsSubmitting(true);
		try {
			const res = await hc.api.organizations.locations[":id"].$put({
				param: { id: editingLocation.id },
				json: { ...values, organizationId },
			});
			if (res.ok) {
				toast.success("Location updated successfully");
				setEditingLocation(null);
				queryClient.invalidateQueries({
					queryKey: ["organization", organizationId, "locations"],
				});
			} else {
				const errorData = await res.json();
				showError(errorData, "Failed to update location");
			}
		} catch (error) {
			console.error("Error updating location:", error);
			showError(error, "Failed to update location");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteLocation = async (id: string) => {
		if (!confirm("Confirm delete location")) return;

		try {
			const res = await hc.api.organizations.locations[":id"].$delete({
				param: { id },
			});
			if (res.ok) {
				toast.success("Location deleted successfully");
				queryClient.invalidateQueries({
					queryKey: ["organization", organizationId, "locations"],
				});
			} else {
				const errorData = await res.json();
				showError(errorData, "Failed to delete location");
			}
		} catch (error) {
			console.error("Error deleting location:", error);
			showError(error, "Failed to delete location");
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-xl">Locations</h2>
				<Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
					<DialogTrigger asChild>
						<Button>Add Location</Button>
					</DialogTrigger>
					<DialogContent className="flex flex-col overflow-hidden sm:max-w-[600px]">
						<DialogHeader className="mt-2">
							<DialogTitle>Add New Location</DialogTitle>
						</DialogHeader>
						<div className="flex-1 pr-2">
							<LocationForm
								onSubmit={handleAddLocation}
								isSubmitting={isSubmitting}
							/>
						</div>
					</DialogContent>
				</Dialog>
			</div>
			<p>Manage your organization's locations</p>

			<Separator />

			{isLoading ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 3 }, (_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: <>
						<Skeleton key={i} className="h-[150px] w-full" />
					))}
				</div>
			) : !locations ||
				!("data" in locations) ||
				locations?.data?.length === 0 ? (
				<p>No locations found</p>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{locations?.data?.map((location) => (
						<Card key={location.id}>
							<CardHeader>
								<CardTitle className="flex items-center justify-between">
									{location.name}
									<div className="flex gap-2">
										<Dialog
											open={editingLocation?.id === location.id}
											onOpenChange={(open) =>
												open
													? setEditingLocation({
															...location,
															description: location.description ?? undefined,
															capacity: location.capacity ?? undefined,
															metadata: location.metadata ?? undefined,
															address: location.address
																? {
																		building: location.address.building ?? "",
																		office: location.address.office ?? "",
																		street: location.address.street ?? "",
																		city: location.address.city ?? "",
																		state: location.address.state ?? undefined,
																		zipCode:
																			location.address.zipCode ?? undefined,
																		country: location.address.country ?? "",
																		latitude: location.address.latitude ?? "",
																		longitude: location.address.longitude ?? "",
																	}
																: undefined,
														})
													: setEditingLocation(null)
											}
										>
											<DialogTrigger asChild>
												<Button variant="outline" size="sm">
													Edit
												</Button>
											</DialogTrigger>
											<DialogContent className="flex max-h-[80vh] flex-col overflow-hidden sm:max-w-[600px]">
												<DialogHeader>
													<DialogTitle>Edit Location</DialogTitle>
												</DialogHeader>
												<div className="flex-1 overflow-y-auto pr-2">
													<LocationForm
														initialValues={editingLocation || undefined}
														onSubmit={handleEditLocation}
														isSubmitting={isSubmitting}
													/>
												</div>
											</DialogContent>
										</Dialog>
										<Button
											variant="destructive"
											size="sm"
											onClick={() => handleDeleteLocation(location.id)}
										>
											Delete
										</Button>
									</div>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								<p>
									<strong>Type:</strong> {location.locationType}
								</p>
								{location.address?.street && (
									<p>
										<strong>Address:</strong> {location.address.street},{" "}
										{location.address.city}, {location.address.country}
									</p>
								)}

								<p>
									<strong>Status:</strong>{" "}
									{location.isActive ? "Active" : "Inactive"}
								</p>
								<p>
									<strong>Default:</strong> {location.isDefault ? "Yes" : "No"}
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
