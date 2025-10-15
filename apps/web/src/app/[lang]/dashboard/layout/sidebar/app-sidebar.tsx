"use client";

import {
	Bot,
	ContainerIcon,
	Frame,
	Map as MapIcon,
	PieChart,
	Settings2,
	StoreIcon,
} from "lucide-react";
import type * as React from "react";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";

// This is sample data.

const data = {
	user: {
		name: "shadcn",
		email: "m@example.com",
		avatar: "/avatars/shadcn.jpg",
	},

	navMain: [
		{
			title: "Store",
			url: "#",
			icon: StoreIcon,
			isActive: true,
			items: [
				{
					title: "Products",
					url: "/dashboard/store/products",
				},
				{
					title: "Orders",
					url: "/dashboard/store/orders",
				},
				{
					title: "Clients",
					url: "/dashboard/store/clients",
				},

				{
					title: "Categories",
					url: "/dashboard/store/product-categories",
				},
				{
					title: "Brands",
					url: "/dashboard/store/brands",
				},
				{
					title: "Settings",
					url: "/dashboard/store/settings",
				},
			],
		},
		{
			title: "Inventory",
			url: "/dashboard",
			icon: ContainerIcon,
			isActive: true,
			items: [
				{
					title: "Items",
					url: "#",
				},

				{
					title: "Suppliers",
					url: "/dashboard/store/suppliers",
				},

				{
					title: "Settings",
					url: "#",
				},
			],
		},

		{
			title: "Settings",
			url: "#",
			icon: Settings2,
			items: [
				{
					title: "General",
					url: "/dashboard/organization/",
				},
				{
					title: "Team",
					url: "#",
				},
				{
					title: "Billing",
					url: "#",
				},
				{
					title: "Limits",
					url: "#",
				},
			],
		},
	],
	projects: [
		{
			name: "Design Engineering",
			url: "#",
			icon: Frame,
		},
		{
			name: "Sales & Marketing",
			url: "#",
			icon: PieChart,
		},
		{
			name: "Travel",
			url: "#",
			icon: MapIcon,
		},
	],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<TeamSwitcher />
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
