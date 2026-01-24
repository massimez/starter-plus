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
import { Edit, Gift, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { hc } from "@/lib/api-client";
import { PointsBadge, RewardIcon } from "../../../_components/reward-icons";
import { RewardForm } from "./reward-form";

interface RewardsManagerProps {
	programId: string;
}

export const RewardsManager = ({ programId }: RewardsManagerProps) => {
	const queryClient = useQueryClient();
	const [isFormOpen, setIsFormOpen] = useState(false);
	// biome-ignore lint/suspicious/noExplicitAny: <>
	const [editingReward, setEditingReward] = useState<any>(null);

	const { data: response, isLoading } = useQuery({
		queryKey: ["rewards", programId],
		queryFn: async () => {
			const res = await hc.api.store.rewards.$get({
				query: { bonusProgramId: programId },
			});
			return await res.json();
		},
	});

	const rewards = response?.data?.rewards || [];

	// biome-ignore lint/suspicious/noExplicitAny: <>
	const handleEdit = (reward: any) => {
		setEditingReward(reward);
		setIsFormOpen(true);
	};

	const handleCreate = () => {
		setEditingReward(null);
		setIsFormOpen(true);
	};

	const handleDelete = async (rewardId: string) => {
		if (!confirm("Are you sure you want to delete this reward?")) return;

		try {
			await hc.api.store.rewards[":id"].$delete({
				param: { id: rewardId },
			});
			toast.success("Reward deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["rewards", programId] });
		} catch (error) {
			console.error(error);
			toast.error("Failed to delete reward");
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
						<CardTitle>Rewards Catalog</CardTitle>
						<CardDescription>
							Manage rewards that users can redeem with points.
						</CardDescription>
					</div>
					<Button size="sm" onClick={handleCreate}>
						<Plus className="mr-2 h-4 w-4" />
						Add Reward
					</Button>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{[1, 2, 3].map((i) => (
								<Skeleton key={i} className="h-40 w-full rounded-xl" />
							))}
						</div>
					) : rewards.length === 0 ? (
						<div className="py-12 text-center text-muted-foreground">
							<div className="mb-4 flex justify-center">
								<div className="rounded-full bg-muted p-4">
									<Gift className="h-8 w-8" />
								</div>
							</div>
							<p className="font-medium text-base">No rewards defined</p>
							<p className="mt-1 text-sm">
								Create rewards for customers to redeem with their points
							</p>
						</div>
					) : (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{rewards.map((reward) => (
								<Card
									key={reward.id}
									className="group relative overflow-hidden transition-all hover:shadow-md"
								>
									<CardHeader className="pb-3">
										<div className="flex items-start justify-between gap-3">
											<div className="flex items-start gap-3">
												<RewardIcon type={reward.type} />
												<div className="min-w-0 flex-1">
													<CardTitle className="line-clamp-1 text-base">
														{reward.name}
													</CardTitle>
													<Badge variant="outline" className="mt-1 text-xs">
														{formatType(reward.type)}
													</Badge>
												</div>
											</div>
											<div className="flex gap-1">
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													onClick={() => handleEdit(reward)}
												>
													<Edit className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-destructive hover:text-destructive"
													onClick={() => handleDelete(reward.id)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
										{reward.description && (
											<CardDescription className="mt-2 line-clamp-2">
												{reward.description}
											</CardDescription>
										)}
									</CardHeader>
									<CardContent className="pt-0">
										<div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
											<p className="text-muted-foreground text-xs">Cost</p>
											<PointsBadge points={reward.pointsCost} />
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<RewardForm
				programId={programId}
				open={isFormOpen}
				onOpenChange={setIsFormOpen}
				initialData={editingReward}
			/>
		</>
	);
};
