"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@workspace/ui/components/sidebar";
import {
	ContainerIcon,
	Frame,
	Map as MapIcon,
	PieChart,
	Settings2,
	StoreIcon,
} from "lucide-react";
import type * as React from "react";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";

// This is sample data.

const data = {
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
					title: "Collections",
					url: "/dashboard/store/product-collections",
				},
				{
					title: "Brands",
					url: "/dashboard/store/brands",
				},
				{
					title: "Shipping",
					url: "/dashboard/store/shipping",
				},
				{
					title: "Settings",
					url: "/dashboard/store/settings",
				},
			],
		},
		{
			title: "Inventory",
			url: "/dashboard/store/inventory",
			icon: ContainerIcon,
			isActive: true,
			items: [
				{
					title: "Overview",
					url: "/dashboard/store/inventory",
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
