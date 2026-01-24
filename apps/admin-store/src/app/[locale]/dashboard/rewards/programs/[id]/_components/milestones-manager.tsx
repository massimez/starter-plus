"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Edit, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { hc } from "@/lib/api-client";
import { MilestoneIcon, PointsBadge } from "../../../_components/reward-icons";
import { MilestoneForm } from "./milestone-form";

interface Milestone {
	id: string;
	name: string;
	description?: string | null;
	type:
		| "first_purchase"
		| "total_spent"
		| "order_count"
		| "product_review"
		| "referral_count"
		| "custom";
	targetValue: string;
	rewardPoints: number;
	isRepeatable: boolean | null;
	sortOrder: number | null;
}

interface MilestonesManagerProps {
	programId: string;
}

export const MilestonesManager = ({ programId }: MilestonesManagerProps) => {
	const queryClient = useQueryClient();
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
		null,
	);

	const { data: response, isLoading } = useQuery({
		queryKey: ["milestones", programId],
		queryFn: async () => {
			const res = await hc.api.store.milestones.$get({
				query: { bonusProgramId: programId },
			});
			return await res.json();
		},
	});

	const milestones = response?.data?.milestones || [];

	const handleEdit = (milestone: Milestone) => {
		setEditingMilestone(milestone);
		setIsFormOpen(true);
	};

	const handleCreate = () => {
		setEditingMilestone(null);
		setIsFormOpen(true);
	};

	const handleDelete = async (milestoneId: string) => {
		if (!confirm("Are you sure you want to delete this milestone?")) return;

		try {
			await hc.api.store.milestones[":id"].$delete({
				param: { id: milestoneId },
			});
			toast.success("Milestone deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["milestones", programId] });
		} catch (error) {
			console.error(error);
			toast.error("Failed to delete milestone");
		}
	};

	const formatType = (type: string) => {
		return type
			.split("_")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	};

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Milestones</CardTitle>
						<CardDescription>
							Manage achievement milestones for users.
						</CardDescription>
					</div>
					<Button size="sm" onClick={handleCreate}>
						<Plus className="mr-2 h-4 w-4" />
						Add Milestone
					</Button>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="grid gap-4 md:grid-cols-2">
							{[1, 2, 3, 4].map((i) => (
								<Skeleton key={i} className="h-[180px] w-full rounded-xl" />
							))}
						</div>
					) : milestones.length === 0 ? (
						<div className="py-12 text-center text-muted-foreground">
							<div className="mb-4 flex justify-center">
								<div className="rounded-full bg-muted p-4">
									<Plus className="h-8 w-8" />
								</div>
							</div>
							<p className="font-medium text-base">No milestones defined</p>
							<p className="mt-1 text-sm">
								Create milestones to reward customer achievements
							</p>
						</div>
					) : (
						<div className="grid gap-4 md:grid-cols-2">
							{milestones.map((milestone: Milestone) => (
								<Card
									key={milestone.id}
									className="group relative overflow-hidden transition-all hover:shadow-md"
								>
									<CardHeader className="pb-3">
										<div className="flex items-start justify-between gap-3">
											<div className="flex items-start gap-3">
												<MilestoneIcon type={milestone.type} />
												<div className="min-w-0 flex-1">
													<CardTitle className="line-clamp-1 text-base">
														{milestone.name}
													</CardTitle>
													<div className="mt-1 flex items-center gap-2">
														<Badge variant="outline" className="text-xs">
															{formatType(milestone.type)}
														</Badge>
														{milestone.isRepeatable && (
															<Badge
																variant="secondary"
																className="gap-1 text-xs"
															>
																<RefreshCw className="h-3 w-3" />
																Repeatable
															</Badge>
														)}
													</div>
												</div>
											</div>
											<div className="flex gap-1">
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													onClick={() => handleEdit(milestone)}
												>
													<Edit className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-destructive hover:text-destructive"
													onClick={() => handleDelete(milestone.id)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
										{milestone.description && (
											<CardDescription className="mt-2 line-clamp-2">
												{milestone.description}
											</CardDescription>
										)}
									</CardHeader>
									<CardContent className="pt-0">
										<div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
											<div className="space-y-1">
												<p className="text-muted-foreground text-xs">
													Target Value
												</p>
												<p className="font-semibold text-lg">
													{milestone.targetValue}
												</p>
											</div>
											<div className="flex flex-col items-end gap-1">
												<p className="text-muted-foreground text-xs">Reward</p>
												<PointsBadge points={milestone.rewardPoints} />
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<MilestoneForm
				programId={programId}
				open={isFormOpen}
				onOpenChange={setIsFormOpen}
				initialData={editingMilestone}
			/>
		</>
	);
};
