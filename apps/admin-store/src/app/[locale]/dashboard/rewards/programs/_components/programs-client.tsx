"use client";

import { useQuery } from "@tanstack/react-query";
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
import {
	ArrowRight,
	Award,
	DollarSign,
	Plus,
	ShoppingBag,
	Trophy,
} from "lucide-react";
import Link from "next/link";
import { PageDashboardHeader } from "@/app/[locale]/(landing)/_components/sections/page-dashboard-header";
import { hc } from "@/lib/api-client";

export const ProgramsClient = () => {
	const { data: response, isLoading } = useQuery({
		queryKey: ["bonus-programs"],
		queryFn: async () => {
			const res = await hc.api.store["bonus-programs"].$get();
			return await res.json();
		},
	});

	const programs = response?.data?.programs || [];

	return (
		<div className="space-y-6 p-4">
			<div className="flex items-center justify-between">
				<PageDashboardHeader
					title="Bonus Programs"
					description="Manage your customer loyalty and rewards programs"
				/>
				<Link href="/dashboard/rewards/programs/new">
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Create Program
					</Button>
				</Link>
			</div>

			{isLoading ? (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-60 w-full rounded-xl" />
					))}
				</div>
			) : programs.length === 0 ? (
				<Card className="flex flex-col items-center justify-center py-16 text-center">
					<div className="mb-6 rounded-full bg-linear-to-br from-primary/20 to-primary/10 p-6">
						<Trophy className="h-12 w-12 text-primary" />
					</div>
					<CardTitle className="mb-3 text-2xl">No programs found</CardTitle>
					<CardDescription className="mb-8 max-w-md text-base">
						Get started by creating your first bonus program to reward your
						loyal customers and boost engagement.
					</CardDescription>
					<Link href="/dashboard/rewards/programs/new">
						<Button size="lg">
							<Plus className="mr-2 h-4 w-4" />
							Create Your First Program
						</Button>
					</Link>
				</Card>
			) : (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{programs.map((program) => (
						<Link
							key={program.id}
							href={`/dashboard/rewards/programs/${program.id}`}
						>
							<Card className="group hover:-translate-y-1 relative h-full transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
								<CardHeader className="space-y-3">
									<div className="flex items-start justify-between">
										<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/10">
											<Trophy className="h-6 w-6 text-primary" />
										</div>
										<Badge
											variant={program.isActive ? "primary" : "secondary"}
											className={
												program.isActive
													? "bg-green-100 text-green-700 hover:bg-green-100"
													: ""
											}
										>
											{program.isActive ? "Active" : "Inactive"}
										</Badge>
									</div>
									<div>
										<CardTitle className="line-clamp-1 text-xl">
											{program.name}
										</CardTitle>
										{program.description && (
											<CardDescription className="mt-1.5 line-clamp-2">
												{program.description}
											</CardDescription>
										)}
									</div>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-1">
											<div className="flex items-center gap-1.5 text-muted-foreground text-xs">
												<Award className="h-3.5 w-3.5" />
												<span>Points / $1</span>
											</div>
											<p className="font-semibold text-lg">
												{program.pointsPerDollar}
											</p>
										</div>
										<div className="space-y-1">
											<div className="flex items-center gap-1.5 text-muted-foreground text-xs">
												<ShoppingBag className="h-3.5 w-3.5" />
												<span>Min Order</span>
											</div>
											<p className="font-semibold text-lg">
												${program.minOrderAmount}
											</p>
										</div>
									</div>
									<div className="space-y-1 rounded-lg border bg-muted/30 p-3">
										<div className="flex items-center gap-1.5 text-muted-foreground text-xs">
											<DollarSign className="h-3.5 w-3.5" />
											<span>Signup Bonus</span>
										</div>
										<p className="font-semibold text-base">
											{program.signupBonus} points
										</p>
									</div>
									<Button
										variant="ghost"
										className="w-full justify-between group-hover:bg-primary/5"
									>
										<span>Manage Program</span>
										<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
									</Button>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			)}
		</div>
	);
};
