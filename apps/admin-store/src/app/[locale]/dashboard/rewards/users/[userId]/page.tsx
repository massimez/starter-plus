"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { AlertCircle } from "lucide-react";
import { hc } from "@/lib/api-client";
import { ManualPointsForm } from "../../_components/manual-points-form";
import { PointsBalanceCard } from "../../_components/points-balance-card";
import { ReferralStatsCard } from "../../_components/referral-stats-card";
import { TransactionHistoryTable } from "../../_components/transaction-history-table";
import { UserCouponsList } from "../../_components/user-coupons-list";

interface UserPointsPageProps {
	params: {
		userId: string;
	};
	searchParams: {
		bonusProgramId?: string;
	};
}

export default function UserPointsPage({
	params,
	searchParams,
}: UserPointsPageProps) {
	const { userId } = params;
	const bonusProgramId = searchParams.bonusProgramId || "";

	// Fetch user points balance
	const {
		data: response,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["points-balance", userId, bonusProgramId],
		queryFn: async () => {
			const res = await hc.api.store.points.balance[":userId"].$get({
				param: { userId },
				query: { bonusProgramId },
			});
			return await res.json();
		},
		enabled: !!bonusProgramId, // Only fetch if bonusProgramId is provided
	});

	const balance = response?.data;

	// Show error if no bonusProgramId
	if (!bonusProgramId) {
		return (
			<div className="container space-y-6 py-6">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						User Points Management
					</h1>
					<p className="text-muted-foreground">
						Manage points, view transactions, and track rewards for this user
					</p>
				</div>
				<div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
					<AlertCircle className="h-5 w-5" />
					<p>
						Missing bonus program ID. Please select a bonus program to view user
						points.
					</p>
				</div>
			</div>
		);
	}

	// Show error state
	if (error) {
		return (
			<div className="container space-y-6 py-6">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						User Points Management
					</h1>
					<p className="text-muted-foreground">
						Manage points, view transactions, and track rewards for this user
					</p>
				</div>
				<div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
					<AlertCircle className="h-5 w-5" />
					<p>Failed to load user points data. Please try again later.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="container space-y-6 py-6">
			<div>
				<h1 className="font-bold text-3xl tracking-tight">
					User Points Management
				</h1>
				<p className="text-muted-foreground">
					Manage points, view transactions, and track rewards for this user
				</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Left Column - Points Balance & Manual Adjustment */}
				<div className="space-y-6 lg:col-span-2">
					{/* Points Balance */}
					{isLoading ? (
						<Skeleton className="h-[400px] w-full" />
					) : balance ? (
						<PointsBalanceCard
							balance={{
								currentPoints: balance.currentPoints,
								pendingPoints: balance.pendingPoints,
								totalEarnedPoints: balance.totalEarnedPoints,
								totalRedeemedPoints: balance.totalRedeemedPoints,
								totalExpiredPoints: balance.totalExpiredPoints,
								currentTier: balance.currentTier,
							}}
							nextTier={balance.nextTier}
						/>
					) : null}

					{/* Transaction History */}
					<TransactionHistoryTable
						userId={userId}
						bonusProgramId={bonusProgramId}
					/>
				</div>

				{/* Right Column - Manual Adjustment Form */}
				<div className="space-y-6">
					{isLoading ? (
						<Skeleton className="h-[300px] w-full" />
					) : balance ? (
						<ManualPointsForm
							userId={userId}
							bonusProgramId={bonusProgramId}
							currentPoints={balance.currentPoints}
						/>
					) : null}
				</div>
			</div>

			{/* Referrals Section */}
			<ReferralStatsCard userId={userId} bonusProgramId={bonusProgramId} />

			{/* Coupons Section */}
			<UserCouponsList userId={userId} />
		</div>
	);
}
