"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { InsertLocation } from "@workspace/server/schema";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
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
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { LocationFormValues } from "@/app/[locale]/dashboard/organization/forms/location-form";
import { LocationForm } from "@/app/[locale]/dashboard/organization/forms/location-form";
import { useGetLocations } from "@/app/[locale]/dashboard/organization/queries";
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
				json: { ...values },
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
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
				<div className="space-y-1">
					<CardTitle>Locations</CardTitle>
					<CardDescription>
						Manage your organization's locations
					</CardDescription>
				</div>
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
			</CardHeader>
			<CardContent>
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
					<div className="fade-in-50 flex min-h-[200px] animate-in flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="1.5"
								stroke="currentColor"
								className="h-6 w-6"
							>
								<title>No locations</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
								/>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
								/>
							</svg>
						</div>
						<h3 className="mt-4 font-semibold text-lg">No locations found</h3>
						<p className="mt-2 mb-4 text-muted-foreground text-sm">
							You haven't added any locations yet.
						</p>
						<Button onClick={() => setIsAddModalOpen(true)}>
							Add Location
						</Button>
					</div>
				) : (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{locations?.data?.map((location) => (
							<div
								key={location.id}
								className="rounded-lg border bg-card text-card-foreground shadow-sm"
							>
								<div className="flex flex-col space-y-1.5 p-6">
									<div className="flex items-center justify-between font-semibold leading-none tracking-tight">
										<span>{location.name}</span>
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
																			state:
																				location.address.state ?? undefined,
																			zipCode:
																				location.address.zipCode ?? undefined,
																			country: location.address.country ?? "",
																			latitude: location.address.latitude ?? "",
																			longitude:
																				location.address.longitude ?? "",
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
									</div>
								</div>
								<div className="space-y-2 p-6 pt-0">
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
										<strong>Default:</strong>{" "}
										{location.isDefault ? "Yes" : "No"}
									</p>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
