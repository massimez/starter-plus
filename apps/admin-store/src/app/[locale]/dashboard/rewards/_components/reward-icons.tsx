/** biome-ignore-all lint/style/noNonNullAssertion: <> */
import { cn } from "@workspace/ui/lib/utils";
import {
	Award,
	BadgePercent,
	DollarSign,
	Gift,
	type LucideIcon,
	Package,
	ShoppingCart,
	Star,
	Target,
	TrendingUp,
	Trophy,
	Truck,
	Users,
} from "lucide-react";

// Milestone Type Icons
export const milestoneIcons: Record<
	string,
	{ icon: LucideIcon; color: string; bgColor: string }
> = {
	first_purchase: {
		icon: ShoppingCart,
		color: "text-blue-600",
		bgColor: "bg-blue-100",
	},
	total_spent: {
		icon: DollarSign,
		color: "text-green-600",
		bgColor: "bg-green-100",
	},
	order_count: {
		icon: Package,
		color: "text-purple-600",
		bgColor: "bg-purple-100",
	},
	product_review: {
		icon: Star,
		color: "text-yellow-600",
		bgColor: "bg-yellow-100",
	},
	referral_count: {
		icon: Users,
		color: "text-pink-600",
		bgColor: "bg-pink-100",
	},
	custom: {
		icon: Target,
		color: "text-gray-600",
		bgColor: "bg-gray-100",
	},
};

// Reward Type Icons
export const rewardIcons: Record<
	string,
	{ icon: LucideIcon; color: string; bgColor: string }
> = {
	percentage_discount: {
		icon: BadgePercent,
		color: "text-orange-600",
		bgColor: "bg-orange-100",
	},
	fixed_discount: {
		icon: DollarSign,
		color: "text-green-600",
		bgColor: "bg-green-100",
	},
	free_shipping: {
		icon: Truck,
		color: "text-blue-600",
		bgColor: "bg-blue-100",
	},
	free_product: {
		icon: Gift,
		color: "text-purple-600",
		bgColor: "bg-purple-100",
	},
	cash_back: {
		icon: DollarSign,
		color: "text-emerald-600",
		bgColor: "bg-emerald-100",
	},
};

// Tier Colors
export const tierColors: Record<
	number,
	{ color: string; bgColor: string; borderColor: string; name: string }
> = {
	0: {
		color: "text-gray-700",
		bgColor: "bg-gray-100",
		borderColor: "border-gray-300",
		name: "Bronze",
	},
	1: {
		color: "text-slate-700",
		bgColor: "bg-slate-100",
		borderColor: "border-slate-300",
		name: "Silver",
	},
	2: {
		color: "text-yellow-700",
		bgColor: "bg-yellow-100",
		borderColor: "border-yellow-300",
		name: "Gold",
	},
	3: {
		color: "text-purple-700",
		bgColor: "bg-purple-100",
		borderColor: "border-purple-300",
		name: "Platinum",
	},
	4: {
		color: "text-cyan-700",
		bgColor: "bg-cyan-100",
		borderColor: "border-cyan-300",
		name: "Diamond",
	},
};

interface MilestoneIconProps {
	type: string;
	className?: string;
}

export const MilestoneIcon = ({ type, className }: MilestoneIconProps) => {
	const config = milestoneIcons[type] ?? milestoneIcons.custom;
	const Icon = config!.icon;

	return (
		<div
			className={cn(
				"flex h-10 w-10 items-center justify-center rounded-lg",
				config!.bgColor,
				className,
			)}
		>
			<Icon className={cn("h-5 w-5", config!.color)} />
		</div>
	);
};

interface RewardIconProps {
	type: string;
	className?: string;
}

export const RewardIcon = ({ type, className }: RewardIconProps) => {
	const config = rewardIcons[type] ?? rewardIcons.percentage_discount;
	const Icon = config!.icon;

	return (
		<div
			className={cn(
				"flex h-10 w-10 items-center justify-center rounded-lg",
				config!.bgColor,
				className,
			)}
		>
			<Icon className={cn("h-5 w-5", config!.color)} />
		</div>
	);
};

interface TierBadgeProps {
	index: number;
	className?: string;
	size?: "sm" | "md" | "lg";
}

export const TierBadge = ({
	index,
	className,
	size = "md",
}: TierBadgeProps) => {
	const config = tierColors[index % 5] ?? tierColors[0];
	const Icon = Trophy;

	const sizeClasses = {
		sm: "h-8 w-8",
		md: "h-10 w-10",
		lg: "h-12 w-12",
	};

	const iconSizes = {
		sm: "h-4 w-4",
		md: "h-5 w-5",
		lg: "h-6 w-6",
	};

	return (
		<div
			className={cn(
				"flex items-center justify-center rounded-lg border-2",
				config!.bgColor,
				config!.borderColor,
				sizeClasses[size],
				className,
			)}
		>
			<Icon className={cn(iconSizes[size], config!.color)} />
		</div>
	);
};

interface PointsBadgeProps {
	points: number | string;
	className?: string;
}

export const PointsBadge = ({ points, className }: PointsBadgeProps) => {
	return (
		<div
			className={cn(
				"inline-flex items-center gap-1 rounded-full bg-linear-to-r from-amber-500 to-orange-500 px-3 py-1 font-semibold text-sm text-white shadow-sm",
				className,
			)}
		>
			<Award className="h-3.5 w-3.5" />
			<span>{points}</span>
		</div>
	);
};

interface StatIconProps {
	icon: LucideIcon;
	className?: string;
	variant?: "default" | "success" | "warning" | "info";
}

export const StatIcon = ({
	icon: Icon,
	className,
	variant = "default",
}: StatIconProps) => {
	const variants = {
		default: "bg-primary/10 text-primary",
		success: "bg-green-100 text-green-600",
		warning: "bg-orange-100 text-orange-600",
		info: "bg-blue-100 text-blue-600",
	};

	return (
		<div
			className={cn(
				"flex h-10 w-10 items-center justify-center rounded-lg",
				variants[variant],
				className,
			)}
		>
			<Icon className="h-5 w-5" />
		</div>
	);
};

// Export icons for direct use
export {
	Award,
	BadgePercent,
	DollarSign,
	Gift,
	Package,
	ShoppingCart,
	Star,
	Target,
	TrendingUp,
	Trophy,
	Truck,
	Users,
};
