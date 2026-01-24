"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Progress } from "@workspace/ui/components/progress";
import { cn } from "@workspace/ui/lib/utils";
import { Award, Clock, TrendingDown, TrendingUp } from "lucide-react";

interface PointsBalanceCardProps {
	balance: {
		currentPoints: number;
		pendingPoints: number;
		totalEarnedPoints: number;
		totalRedeemedPoints: number;
		totalExpiredPoints: number;
		currentTier?: {
			id: string;
			name: string;
			minPoints: number;
		} | null;
	};
	nextTier?: {
		name: string;
		minPoints: number;
	} | null;
	className?: string;
}

export const PointsBalanceCard = ({
	balance,
	nextTier,
	className,
}: PointsBalanceCardProps) => {
	const tierProgress = nextTier
		? ((balance.currentPoints - (balance.currentTier?.minPoints || 0)) /
				(nextTier.minPoints - (balance.currentTier?.minPoints || 0))) *
			100
		: 100;

	const pointsToNextTier = nextTier
		? nextTier.minPoints - balance.currentPoints
		: 0;

	return (
		<Card className={cn("overflow-hidden", className)}>
			<CardHeader className="bg-linear-to-br from-primary/10 to-primary/5 pb-4">
				<CardTitle className="flex items-center gap-2">
					<Award className="h-5 w-5 text-primary" />
					Points Balance
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-6">
				{/* Current Points - Large Display */}
				<div className="mb-6 text-center">
					<p className="text-muted-foreground text-sm">Current Points</p>
					<p className="font-bold text-5xl text-primary">
						{balance.currentPoints.toLocaleString()}
					</p>
					{balance.currentTier && (
						<p className="mt-2 text-muted-foreground text-sm">
							{balance.currentTier.name} Tier
						</p>
					)}
				</div>

				{/* Tier Progress */}
				{nextTier && (
					<div className="mb-6 space-y-2 rounded-lg border bg-muted/30 p-4">
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">
								Progress to {nextTier.name}
							</span>
							<span className="font-medium">
								{pointsToNextTier.toLocaleString()} points needed
							</span>
						</div>
						<Progress value={Math.min(tierProgress, 100)} className="h-2" />
					</div>
				)}

				{/* Stats Grid */}
				<div className="grid grid-cols-2 gap-4">
					{/* Pending Points */}
					<div className="space-y-1 rounded-lg border bg-amber-50 p-3 dark:bg-amber-950/20">
						<div className="flex items-center gap-1.5 text-amber-700 text-xs dark:text-amber-400">
							<Clock className="h-3.5 w-3.5" />
							<span>Pending</span>
						</div>
						<p className="font-semibold text-lg">
							{balance.pendingPoints.toLocaleString()}
						</p>
					</div>

					{/* Total Earned */}
					<div className="space-y-1 rounded-lg border bg-green-50 p-3 dark:bg-green-950/20">
						<div className="flex items-center gap-1.5 text-green-700 text-xs dark:text-green-400">
							<TrendingUp className="h-3.5 w-3.5" />
							<span>Total Earned</span>
						</div>
						<p className="font-semibold text-lg">
							{balance.totalEarnedPoints.toLocaleString()}
						</p>
					</div>

					{/* Total Redeemed */}
					<div className="space-y-1 rounded-lg border bg-blue-50 p-3 dark:bg-blue-950/20">
						<div className="flex items-center gap-1.5 text-blue-700 text-xs dark:text-blue-400">
							<TrendingDown className="h-3.5 w-3.5" />
							<span>Redeemed</span>
						</div>
						<p className="font-semibold text-lg">
							{balance.totalRedeemedPoints.toLocaleString()}
						</p>
					</div>

					{/* Total Expired */}
					<div className="space-y-1 rounded-lg border bg-gray-50 p-3 dark:bg-gray-950/20">
						<div className="flex items-center gap-1.5 text-muted-foreground text-xs">
							<Clock className="h-3.5 w-3.5" />
							<span>Expired</span>
						</div>
						<p className="font-semibold text-lg">
							{balance.totalExpiredPoints.toLocaleString()}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
