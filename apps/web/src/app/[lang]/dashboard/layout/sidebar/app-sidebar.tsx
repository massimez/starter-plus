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
import { NavProjects } from "./nav-projects";
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
					url: "#",
				},
				{
					title: "Orders",
					url: "#",
				},
				{
					title: "Clients",
					url: "#",
				},
				{
					title: "Suppliers",
					url: "#",
				},
				{
					title: "Referrals",
					url: "#",
				},
				{
					title: "Settings",
					url: "#",
				},
			],
		},
		{
			title: "Inventory",
			url: "#",
			icon: ContainerIcon,
			isActive: true,
			items: [
				{
					title: "Items",
					url: "#",
				},
				{
					title: "Orders",
					url: "#",
				},
				{
					title: "Clients",
					url: "#",
				},
				{
					title: "Suppliers",
					url: "#",
				},
				{
					title: "Referrals",
					url: "#",
				},
				{
					title: "Settings",
					url: "#",
				},
			],
		},
		{
			title: "Models",
			url: "#",
			icon: Bot,
			items: [
				{
					title: "Genesis",
					url: "#",
				},
				{
					title: "Explorer",
					url: "#",
				},
				{
					title: "Quantum",
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
					url: "#",
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
				<NavProjects projects={data.projects} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
