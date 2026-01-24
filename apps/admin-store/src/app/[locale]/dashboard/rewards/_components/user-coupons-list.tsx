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
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import {
	CheckCircle2,
	Clock,
	Gift,
	Percent,
	Ticket,
	XCircle,
} from "lucide-react";
import { hc } from "@/lib/api-client";

interface Coupon {
	id: string;
	code: string;
	type: string;
	discountPercentage: string | null;
	discountAmount: string | null;
	minOrderAmount: string | null;
	status: "active" | "used" | "expired" | "cancelled";
	expiresAt: string;
	usedAt: string | null;
	reward: {
		name: string;
		description: string | null;
	};
}

interface UserCouponsListProps {
	userId: string;
}

const STATUS_CONFIG = {
	active: {
		icon: CheckCircle2,
		color: "text-green-600 dark:text-green-400",
		bgColor: "bg-green-50 dark:bg-green-950/20",
		label: "Active",
	},
	used: {
		icon: CheckCircle2,
		color: "text-blue-600 dark:text-blue-400",
		bgColor: "bg-blue-50 dark:bg-blue-950/20",
		label: "Used",
	},
	expired: {
		icon: Clock,
		color: "text-gray-600 dark:text-gray-400",
		bgColor: "bg-gray-50 dark:bg-gray-950/20",
		label: "Expired",
	},
	cancelled: {
		icon: XCircle,
		color: "text-red-600 dark:text-red-400",
		bgColor: "bg-red-50 dark:bg-red-950/20",
		label: "Cancelled",
	},
};

export const UserCouponsList = ({ userId }: UserCouponsListProps) => {
	const { data: response, isLoading } = useQuery({
		queryKey: ["user-coupons", userId],
		queryFn: async () => {
			const res = await hc.api.store.coupons.user[":userId"].$get({
				param: { userId },
			});
			return await res.json();
		},
	});

	const coupons = response?.data?.coupons || [];

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		}).format(date);
	};

	const getDiscountDisplay = (coupon: Coupon) => {
		if (coupon.type === "percentage_discount" && coupon.discountPercentage) {
			return `${coupon.discountPercentage}% OFF`;
		}
		if (coupon.type === "fixed_discount" && coupon.discountAmount) {
			return `$${coupon.discountAmount} OFF`;
		}
		if (coupon.type === "free_shipping") {
			return "FREE SHIPPING";
		}
		return "DISCOUNT";
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Ticket className="h-5 w-5 text-primary" />
					My Coupons
				</CardTitle>
				<CardDescription>
					Coupons earned from redeeming reward points
				</CardDescription>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="grid gap-4 md:grid-cols-2">
						{[1, 2, 3, 4].map((i) => (
							<Skeleton key={i} className="h-32 w-full" />
						))}
					</div>
				) : coupons.length === 0 ? (
					<div className="py-12 text-center text-muted-foreground">
						<Gift className="mx-auto mb-4 h-12 w-12 opacity-50" />
						<p className="font-medium">No coupons yet</p>
						<p className="mt-1 text-sm">
							Redeem rewards to earn discount coupons
						</p>
					</div>
				) : (
					<div className="grid gap-4 md:grid-cols-2">
						{coupons.map((coupon: Coupon) => {
							const statusConfig = STATUS_CONFIG[coupon.status];
							const StatusIcon = statusConfig.icon;

							return (
								<Card
									key={coupon.id}
									className={cn(
										"relative overflow-hidden border-2",
										coupon.status === "active"
											? "border-primary/20"
											: "opacity-60",
									)}
								>
									<CardHeader className="pb-3">
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0 flex-1">
												<CardTitle className="line-clamp-1 text-base">
													{coupon.reward.name}
												</CardTitle>
												{coupon.reward.description && (
													<CardDescription className="mt-1 line-clamp-2 text-xs">
														{coupon.reward.description}
													</CardDescription>
												)}
											</div>
											<Badge
												variant={
													coupon.status === "active" ? "primary" : "secondary"
												}
												className="shrink-0"
											>
												<StatusIcon className="mr-1 h-3 w-3" />
												{statusConfig.label}
											</Badge>
										</div>
									</CardHeader>
									<CardContent className="space-y-3">
										{/* Coupon Code */}
										<div className="rounded-lg border-2 border-dashed bg-muted/50 p-3 text-center">
											<p className="text-muted-foreground text-xs">
												Coupon Code
											</p>
											<code className="font-bold font-mono text-lg">
												{coupon.code}
											</code>
										</div>

										{/* Discount Amount */}
										<div
											className={cn(
												"rounded-lg p-3 text-center",
												statusConfig.bgColor,
											)}
										>
											<div
												className={cn(
													"flex items-center justify-center gap-2",
													statusConfig.color,
												)}
											>
												<Percent className="h-4 w-4" />
												<span className="font-bold text-lg">
													{getDiscountDisplay(coupon)}
												</span>
											</div>
											{coupon.minOrderAmount && (
												<p className="mt-1 text-muted-foreground text-xs">
													Min. order: ${coupon.minOrderAmount}
												</p>
											)}
										</div>

										{/* Expiration */}
										<div className="flex items-center justify-between text-xs">
											<span className="text-muted-foreground">
												{coupon.status === "used" && coupon.usedAt
													? `Used on ${formatDate(coupon.usedAt)}`
													: `Expires ${formatDate(coupon.expiresAt)}`}
											</span>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
};
