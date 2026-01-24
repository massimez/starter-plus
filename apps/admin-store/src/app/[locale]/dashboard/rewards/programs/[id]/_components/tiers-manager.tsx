"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Award, Edit, Plus, Trash2, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { hc } from "@/lib/api-client";
import { TierBadge } from "../../../_components/reward-icons";
import { TierForm } from "./tier-form";

interface TiersManagerProps {
	programId: string;
}

export const TiersManager = ({ programId }: TiersManagerProps) => {
	const queryClient = useQueryClient();
	const [isFormOpen, setIsFormOpen] = useState(false);
	// biome-ignore lint/suspicious/noExplicitAny: <>
	const [editingTier, setEditingTier] = useState<any>(null);

	const { data: response, isLoading } = useQuery({
		queryKey: ["bonus-tiers", programId],
		queryFn: async () => {
			const res = await hc.api.store.tiers.$get({
				query: { bonusProgramId: programId },
			});
			return await res.json();
		},
	});

	const tiers = response?.data?.tiers || [];

	// biome-ignore lint/suspicious/noExplicitAny: <>
	const handleEdit = (tier: any) => {
		setEditingTier(tier);
		setIsFormOpen(true);
	};

	const handleCreate = () => {
		setEditingTier(null);
		setIsFormOpen(true);
	};

	const handleDelete = async (tierId: string) => {
		if (!confirm("Are you sure you want to delete this tier?")) return;

		try {
			await hc.api.store.tiers[":id"].$delete({
				param: { id: tierId },
			});
			toast.success("Tier deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["bonus-tiers", programId] });
		} catch (error) {
			console.error(error);
			toast.error("Failed to delete tier");
		}
	};

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Tiers</CardTitle>
						<CardDescription>
							Manage loyalty tiers and their benefits.
						</CardDescription>
					</div>
					<Button size="sm" onClick={handleCreate}>
						<Plus className="mr-2 h-4 w-4" />
						Add Tier
					</Button>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="grid gap-4 md:grid-cols-2">
							{[1, 2, 3, 4].map((i) => (
								<Skeleton key={i} className="h-[140px] w-full rounded-xl" />
							))}
						</div>
					) : tiers.length === 0 ? (
						<div className="py-12 text-center text-muted-foreground">
							<div className="mb-4 flex justify-center">
								<div className="rounded-full bg-muted p-4">
									<Award className="h-8 w-8" />
								</div>
							</div>
							<p className="font-medium text-base">No tiers defined</p>
							<p className="mt-1 text-sm">
								Create tiers to reward customers based on their points
							</p>
						</div>
					) : (
						<div className="grid gap-4 md:grid-cols-2">
							{tiers.map((tier, index: number) => (
								<Card
									key={tier.id}
									className="group relative overflow-hidden transition-all hover:shadow-md"
								>
									<CardHeader className="pb-3">
										<div className="flex items-start justify-between gap-3">
											<div className="flex items-start gap-3">
												<TierBadge index={index} size="lg" />
												<div className="min-w-0 flex-1">
													<CardTitle className="line-clamp-1 text-base">
														{tier.name}
													</CardTitle>
													<p className="mt-1 text-muted-foreground text-sm">
														{tier.slug}
													</p>
												</div>
											</div>
											<div className="flex gap-1">
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													onClick={() => handleEdit(tier)}
												>
													<Edit className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-destructive hover:text-destructive"
													onClick={() => handleDelete(tier.id)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
										{tier.description && (
											<CardDescription className="mt-2 line-clamp-2">
												{tier.description}
											</CardDescription>
										)}
									</CardHeader>
									<CardContent className="pt-0">
										<div className="grid grid-cols-2 gap-3">
											<div className="space-y-1 rounded-lg border bg-muted/30 p-3">
												<div className="flex items-center gap-1.5 text-muted-foreground text-xs">
													<Award className="h-3.5 w-3.5" />
													<span>Min Points</span>
												</div>
												<p className="font-semibold text-lg">
													{tier.minPoints}
												</p>
											</div>
											<div className="space-y-1 rounded-lg border bg-linear-to-br from-primary/10 to-primary/5 p-3">
												<div className="flex items-center gap-1.5 text-muted-foreground text-xs">
													<TrendingUp className="h-3.5 w-3.5" />
													<span>Multiplier</span>
												</div>
												<p className="font-bold text-lg text-primary">
													x{tier.multiplier}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<TierForm
				programId={programId}
				open={isFormOpen}
				onOpenChange={setIsFormOpen}
				initialData={editingTier}
			/>
		</>
	);
};
