"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@workspace/ui/components/sidebar";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useMounted } from "@workspace/ui/hooks/use-mounted";
import { Building2, ChevronsUpDown, Plus } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { useModal } from "@/components/modals/modal-context";
import { authClient } from "@/lib/auth-client";

type Organization = {
	id: string;
	name: string;
	createdAt: Date;
	slug: string;
	metadata?: Record<string, unknown>;
	logo?: string | null | undefined;
};

export function TeamSwitcher() {
	const isMounted = useMounted();
	const { isMobile } = useSidebar();
	const { data: listOrganizations, isPending: orgsLoading } =
		authClient.useListOrganizations();
	const { data: activeOrganization, isPending: activeOrgLoading } =
		authClient.useActiveOrganization();

	const [isSwitching, setIsSwitching] = React.useState(false);

	const handleSwitch = async (org: Organization) => {
		setIsSwitching(true);
		try {
			await authClient.organization.setActive({
				organizationId: org.id,
				organizationSlug: org.slug,
			});
		} finally {
			setIsSwitching(false);
		}
	};
	const { openModal } = useModal();
	const loading = orgsLoading || activeOrgLoading || isSwitching;
	console.log("SideBarLoaded:", {
		orgsLoading,
		activeOrgLoading,
		isSwitching,
		loading,
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: <ex>
	React.useEffect(() => {
		if (
			!loading &&
			!activeOrganization &&
			listOrganizations?.length &&
			listOrganizations[0]
		) {
			handleSwitch(listOrganizations[0]).catch(console.error);
		}
	}, [activeOrganization, listOrganizations, loading]);

	if (!isMounted) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton
						size="lg"
						className="p-0! data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						disabled={true}
					>
						<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
							<Skeleton className="size-4 text-muted-foreground" />
						</div>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<Skeleton className="mb-1 h-4 w-24 bg-primary/50" />
							<Skeleton className="h-3 w-16 bg-primary/50" />
						</div>
						<ChevronsUpDown className="ml-auto" />
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="p-0! data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							disabled={!!loading}
						>
							<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
								<Skeleton
									isLoading={!!loading}
									className="size-4 text-muted-foreground"
								>
									{activeOrganization?.logo ? (
										// eslint-disable-next-line @next/next/no-img-element
										// biome-ignore lint/performance/noImgElement: <''>
										<img
											src={activeOrganization.logo}
											alt={activeOrganization.name}
											width={16}
											height={16}
											className="size-4 object-contain"
										/>
									) : (
										<Building2 className="size-4" />
									)}
								</Skeleton>
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<Skeleton
									isLoading={loading}
									className="mb-1 h-4 w-24 bg-primary/50"
								>
									<span className="truncate font-medium">
										{activeOrganization?.name}
									</span>{" "}
								</Skeleton>

								<Skeleton
									isLoading={loading}
									className="h-3 w-16 bg-primary/50"
								>
									<span className="truncate text-xs">
										{activeOrganization?.slug}
									</span>
								</Skeleton>
							</div>
							<ChevronsUpDown className="ml-auto" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						align="start"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
						<DropdownMenuLabel className="text-muted-foreground text-xs">
							{"Organizations"}
						</DropdownMenuLabel>
						{orgsLoading
							? Array.from({ length: 3 }).map((_, i) => (
									<DropdownMenuItem
										key={`org-${
											// biome-ignore lint/suspicious/noArrayIndexKey: <ex>
											i
										}`}
										className="gap-2 p-2"
									>
										<Skeleton className="size-6 rounded-md border" />
										<Skeleton className="h-4 w-24" />
									</DropdownMenuItem>
								))
							: listOrganizations?.map((org, index) => (
									<DropdownMenuItem
										key={org.id}
										onClick={() => handleSwitch(org)}
										className="gap-2 p-2"
									>
										<div className="flex size-6 items-center justify-center overflow-hidden rounded-md border bg-white">
											{org.logo ? (
												<Image
													src={org.logo}
													alt={org.name}
													width={24}
													height={24}
													className="size-3.5 object-contain"
												/>
											) : (
												<Building2 className="size-3.5 shrink-0" />
											)}
										</div>
										{org.name}
										<DropdownMenuShortcut>{`⌘${index + 1}`}</DropdownMenuShortcut>
									</DropdownMenuItem>
								))}
						<DropdownMenuSeparator />

						<DropdownMenuItem
							onClick={() => {
								openModal("createOrg", null);
							}}
							className="gap-2 p-2"
						>
							<div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
								<Plus className="size-4" />
							</div>
							<div className="font-medium text-muted-foreground">
								{"Add organization"}
							</div>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
