"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
	CheckCircle2,
	Clock,
	Copy,
	Share2,
	UserPlus,
	Users,
} from "lucide-react";
import { toast } from "sonner";
import { hc } from "@/lib/api-client";

interface ReferralStatsCardProps {
	userId: string;
	bonusProgramId: string;
}

export const ReferralStatsCard = ({
	userId,
	bonusProgramId,
}: ReferralStatsCardProps) => {
	const { data: response, isLoading } = useQuery({
		queryKey: ["referral-stats", userId, bonusProgramId],
		queryFn: async () => {
			const res = await hc.api.store.referrals.stats[":userId"].$get({
				param: { userId },
				query: { bonusProgramId },
			});
			return await res.json();
		},
		enabled: !!bonusProgramId, // Only fetch if bonusProgramId is provided
	});

	const stats = response?.data;
	const referralCode = stats?.referralCode || "";
	const pendingReferrals =
		(stats?.totalReferrals || 0) - (stats?.successfulReferrals || 0);

	const copyReferralCode = (code: string) => {
		navigator.clipboard.writeText(code);
		toast.success("Referral code copied to clipboard!");
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-4 w-48" />
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
						{[1, 2, 3, 4].map((i) => (
							<Skeleton key={i} className="h-24 w-full" />
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<Users className="h-5 w-5 text-primary" />
							Referral Program
						</CardTitle>
						<CardDescription>
							Track referrals and earn bonus points
						</CardDescription>
					</div>
					<Button variant="outline" size="sm">
						<Share2 className="mr-2 h-4 w-4" />
						Share Code
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Stats Grid */}
				<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
					<div className="space-y-1 rounded-lg border bg-muted/30 p-4">
						<div className="flex items-center gap-1.5 text-muted-foreground text-xs">
							<Users className="h-3.5 w-3.5" />
							<span>Total Referrals</span>
						</div>
						<p className="font-bold text-2xl">{stats?.totalReferrals || 0}</p>
					</div>

					<div className="space-y-1 rounded-lg border bg-green-50 p-4 dark:bg-green-950/20">
						<div className="flex items-center gap-1.5 text-green-700 text-xs dark:text-green-400">
							<CheckCircle2 className="h-3.5 w-3.5" />
							<span>Successful</span>
						</div>
						<p className="font-bold text-2xl text-green-700 dark:text-green-400">
							{stats?.successfulReferrals || 0}
						</p>
					</div>

					<div className="space-y-1 rounded-lg border bg-amber-50 p-4 dark:bg-amber-950/20">
						<div className="flex items-center gap-1.5 text-amber-700 text-xs dark:text-amber-400">
							<Clock className="h-3.5 w-3.5" />
							<span>Pending</span>
						</div>
						<p className="font-bold text-2xl text-amber-700 dark:text-amber-400">
							{pendingReferrals}
						</p>
					</div>

					<div className="space-y-1 rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/20">
						<div className="flex items-center gap-1.5 text-blue-700 text-xs dark:text-blue-400">
							<UserPlus className="h-3.5 w-3.5" />
							<span>Bonuses Earned</span>
						</div>
						<p className="font-bold text-2xl text-blue-700 dark:text-blue-400">
							{stats?.bonusesEarned || 0}
						</p>
					</div>
				</div>

				{/* Referral Code Display */}
				<div className="rounded-lg border bg-linear-to-br from-primary/10 to-primary/5 p-4">
					<p className="mb-2 text-muted-foreground text-sm">
						Your Referral Code
					</p>
					<div className="flex items-center gap-2">
						<code className="flex-1 rounded bg-background px-3 py-2 font-bold font-mono text-lg">
							{referralCode}
						</code>
						<Button
							variant="outline"
							size="icon"
							onClick={() => copyReferralCode(referralCode)}
						>
							<Copy className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
