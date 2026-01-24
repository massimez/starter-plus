"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@workspace/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import {
	CheckCircle2,
	Clock,
	Search,
	UserCheck,
	UserPlus,
	Users,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { hc } from "@/lib/api-client";
import { StatIcon } from "../../../_components/reward-icons";

interface ReferralsManagerProps {
	programId: string;
}

export const ReferralsManager = ({ programId }: ReferralsManagerProps) => {
	const [searchQuery, setSearchQuery] = useState("");

	const { data: response, isLoading } = useQuery({
		queryKey: ["program-referrals", programId],
		queryFn: async () => {
			const res = await hc.api.store.referrals.program[":programId"].$get({
				param: { programId },
			});
			return await res.json();
		},
	});

	const referralsData = response?.data;
	const referrals = referralsData?.referrals || [];
	const stats = referralsData?.stats;

	// Filter referrals based on search query
	const filteredReferrals = referrals.filter((referral) => {
		const query = searchQuery.toLowerCase();
		return (
			referral.referralCode.toLowerCase().includes(query) ||
			referral.referrer?.name?.toLowerCase().includes(query) ||
			referral.referrer?.email?.toLowerCase().includes(query) ||
			referral.referredUser?.name?.toLowerCase().includes(query) ||
			referral.referredUser?.email?.toLowerCase().includes(query)
		);
	});

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-32 w-full rounded-xl" />
					))}
				</div>
				<Skeleton className="h-96 w-full rounded-xl" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Statistics Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Total Referrals
						</CardTitle>
						<StatIcon icon={Users} variant="info" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{stats?.totalReferrals || 0}
						</div>
						<p className="text-muted-foreground text-xs">
							All referral codes created
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Successful Conversions
						</CardTitle>
						<StatIcon icon={UserCheck} variant="success" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{stats?.successfulReferrals || 0}
						</div>
						<p className="text-muted-foreground text-xs">Users who signed up</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Pending Referrals
						</CardTitle>
						<StatIcon icon={Clock} variant="warning" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{stats?.pendingReferrals || 0}
						</div>
						<p className="text-muted-foreground text-xs">Awaiting signup</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Bonuses Awarded
						</CardTitle>
						<StatIcon icon={CheckCircle2} variant="success" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{stats?.referrerBonusesAwarded || 0}
						</div>
						<p className="text-muted-foreground text-xs">
							Referrer bonuses given
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Referrals Table */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<UserPlus className="h-5 w-5 text-primary" />
								Referral Details
							</CardTitle>
							<CardDescription>
								View all referrals and their status
							</CardDescription>
						</div>
						<div className="relative w-64">
							<Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search referrals..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-8"
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{filteredReferrals.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<div className="mb-4 rounded-full bg-muted p-4">
								<Users className="h-8 w-8 text-muted-foreground" />
							</div>
							<h3 className="mb-2 font-semibold text-lg">
								{searchQuery ? "No referrals found" : "No referrals yet"}
							</h3>
							<p className="text-muted-foreground text-sm">
								{searchQuery
									? "Try adjusting your search query"
									: "Referrals will appear here when users share their codes"}
							</p>
						</div>
					) : (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Referral Code</TableHead>
										<TableHead>Referrer</TableHead>
										<TableHead>Referred User</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Signup Date</TableHead>
										<TableHead>Bonuses</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredReferrals.map((referral) => (
										<TableRow key={referral.id}>
											<TableCell className="font-medium font-mono">
												{referral.referralCode}
											</TableCell>
											<TableCell>
												<div className="flex flex-col">
													<span className="font-medium">
														{referral.referrer?.name || "Unknown"}
													</span>
													<span className="text-muted-foreground text-xs">
														{referral.referrer?.email}
													</span>
												</div>
											</TableCell>
											<TableCell>
												{referral.referredUser ? (
													<div className="flex flex-col">
														<span className="font-medium">
															{referral.referredUser.name || "Unknown"}
														</span>
														<span className="text-muted-foreground text-xs">
															{referral.referredUser.email}
														</span>
													</div>
												) : (
													<span className="text-muted-foreground text-sm">
														Not signed up
													</span>
												)}
											</TableCell>
											<TableCell>
												{referral.signedUpAt ? (
													<Badge
														variant="outline"
														className="gap-1 border-green-200 bg-green-50 text-green-700"
													>
														<CheckCircle2 className="h-3 w-3" />
														Completed
													</Badge>
												) : (
													<Badge
														variant="outline"
														className="gap-1 border-yellow-200 bg-yellow-50 text-yellow-700"
													>
														<Clock className="h-3 w-3" />
														Pending
													</Badge>
												)}
											</TableCell>
											<TableCell>
												{referral.signedUpAt ? (
													<span className="text-sm">
														{new Date(referral.signedUpAt).toLocaleDateString()}
													</span>
												) : (
													<span className="text-muted-foreground text-sm">
														—
													</span>
												)}
											</TableCell>
											<TableCell>
												<div className="flex gap-2">
													{referral.referrerBonusGiven ? (
														<Badge
															variant="outline"
															className="gap-1 border-blue-200 bg-blue-50 text-blue-700"
														>
															<CheckCircle2 className="h-3 w-3" />
															Referrer
														</Badge>
													) : (
														<Badge variant="outline" className="gap-1">
															<XCircle className="h-3 w-3" />
															Referrer
														</Badge>
													)}
													{referral.refereeBonusGiven ? (
														<Badge
															variant="outline"
															className="gap-1 border-blue-200 bg-blue-50 text-blue-700"
														>
															<CheckCircle2 className="h-3 w-3" />
															Referee
														</Badge>
													) : (
														<Badge variant="outline" className="gap-1">
															<XCircle className="h-3 w-3" />
															Referee
														</Badge>
													)}
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};
