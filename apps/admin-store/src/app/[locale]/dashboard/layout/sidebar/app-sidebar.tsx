"use client";

import { useQuery } from "@tanstack/react-query";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarRail,
} from "@workspace/ui/components/sidebar";
import {
	ContainerIcon,
	Landmark,
	Settings2,
	StoreIcon,
	Trophy,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import type * as React from "react";
import { hc } from "@/lib/api-client";
import { NavMain } from "./nav-main";

import { TeamSwitcher } from "./team-switcher";

/* -----------------------------------------------
 * BASE NAVIGATION
 * ----------------------------------------------- */
const baseNavMain = [
	{
		title: "Store",
		url: "#",
		icon: StoreIcon,
		isActive: false,
		items: [
			{ title: "Products", url: "/dashboard/store/products" },
			{ title: "Orders", url: "/dashboard/store/orders" },
			{ title: "Clients", url: "/dashboard/store/clients" },
			{ title: "Collections", url: "/dashboard/store/product-collections" },
			{ title: "Brands", url: "/dashboard/store/brands" },
			{ title: "Shipping", url: "/dashboard/store/shipping" },
		],
	},
	{
		title: "Inventory",
		url: "/dashboard/store/inventory",
		icon: ContainerIcon,
		isActive: false,
		items: [
			{ title: "Overview", url: "/dashboard/store/inventory" },
			{ title: "Suppliers", url: "/dashboard/store/suppliers" },
		],
	},
	{
		title: "Rewards",
		url: "#",
		icon: Trophy,
		isActive: false,
		items: [], // dynamic
	},
	{
		title: "Financial",
		url: "#",
		icon: Landmark,
		isActive: false,
		items: [
			{ title: "Invoices", url: "/dashboard/financial/invoices" },
			{ title: "Bills", url: "/dashboard/financial/bills" },
			{ title: "Expenses", url: "/dashboard/financial/expenses" },
			{ title: "Payroll", url: "/dashboard/financial/payroll" },
			{ title: "Accounting", url: "/dashboard/financial/accounting" },
			{ title: "Reports", url: "/dashboard/financial/reports" },
		],
	},
	{
		title: "Settings",
		url: "#",
		icon: Settings2,
		items: [{ title: "General", url: "/dashboard/organization/" }],
	},
];

/* -----------------------------------------------
 * HELPERS
 * ----------------------------------------------- */
const rewardTabs = [
	"overview",
	"tiers",
	"rewards",
	"milestones",
	"referrals",
	"settings",
] as const;

type RewardTab = (typeof rewardTabs)[number];

/** Build a reward program URL */
const rewardUrl = (programId: string | null, tab: RewardTab) =>
	programId
		? `/dashboard/rewards/programs/${programId}?tab=${tab}`
		: "/dashboard/rewards/programs";

/** Build item with click action */
const buildRewardItem = (
	title: string,
	tab: RewardTab,
	programId: string | null,
	router: ReturnType<typeof useRouter>,
) => {
	const url = rewardUrl(programId, tab);

	return {
		title,
		url,
		action: () => router.push(url),
	};
};

/* -----------------------------------------------
 * COMPONENT
 * ----------------------------------------------- */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const router = useRouter();
	const pathname = usePathname();

	// Fetch active reward program
	const { data: programsResponse } = useQuery({
		queryKey: ["bonus-programs"],
		queryFn: async () => {
			const res = await hc.api.store["bonus-programs"].$get();
			return res.json();
		},
	});

	const activeProgram = programsResponse?.data?.programs?.find(
		(p) => p.isActive,
	);
	const programId = activeProgram?.id ?? null;

	/* Build rewards items */
	const rewardItems = [
		buildRewardItem("Overview", "overview", programId, router),
		buildRewardItem("Tiers", "tiers", programId, router),
		buildRewardItem("Rewards", "rewards", programId, router),
		buildRewardItem("Milestones", "milestones", programId, router),
		buildRewardItem("Referrals", "referrals", programId, router),
		{ title: "Programs", url: "/dashboard/rewards/programs" },
	];

	/* Merge rewards into navMain */
	const navMain = baseNavMain.map((item) => {
		const items = item.title === "Rewards" ? rewardItems : item.items;
		const isActive = items?.some(
			(subItem) => subItem.url !== "#" && pathname.startsWith(subItem.url),
		);

		return {
			...item,
			items,
			isActive: isActive ?? false,
		};
	});

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<TeamSwitcher />
			</SidebarHeader>

			<SidebarContent>
				<NavMain items={navMain} />
			</SidebarContent>

			<SidebarRail />
		</Sidebar>
	);
}
