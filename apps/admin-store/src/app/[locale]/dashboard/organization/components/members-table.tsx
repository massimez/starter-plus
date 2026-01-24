"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { toast } from "sonner";
import {
	useActiveOrganization,
	useGetFullOrganization,
	useResendInvitation,
} from "../queries";

// biome-ignore lint/suspicious/noExplicitAny: <>
function MemberRow({ member }: { member: any }) {
	// const t = useTranslations("common"); // removed
	return (
		<TableRow key={member.id}>
			<TableCell className="">
				<div className="flex items-center gap-2">
					<Avatar className="h-8 w-8 shrink-0">
						<AvatarImage src={member.user?.image ?? ""} />
						<AvatarFallback>{member.user?.name?.[0] ?? "?"}</AvatarFallback>
					</Avatar>
					<span className="truncate">{member.user?.name ?? "Unknown"}</span>
				</div>
			</TableCell>
			<TableCell className="">
				<span className="block truncate">{member.user?.email ?? "-"}</span>
			</TableCell>
			<TableCell className="">
				<Badge variant="secondary">{member.role}</Badge>
			</TableCell>
			<TableCell className="text-right">
				<Button variant="ghost" size="sm">
					Edit
				</Button>
			</TableCell>
		</TableRow>
	);
}

// biome-ignore lint/suspicious/noExplicitAny: <>
function InvitationRow({ invitation }: { invitation: any }) {
	// const t = useTranslations("common"); // removed
	const { activeOrganization } = useActiveOrganization();
	const { mutate: resendInvitation, isPending } = useResendInvitation();

	const handleResend = () => {
		if (!activeOrganization?.id) {
			toast.error("Error", {
				description: "Organization not found",
			});
			return;
		}

		resendInvitation(
			{
				email: invitation.email,
				role: invitation.role,
				organizationId: activeOrganization.id,
			},
			{
				onSuccess: () => {
					toast.success("Success", {
						description: "Invitation resent successfully",
					});
				},
				onError: (error) => {
					toast.error("Error", {
						description: error.message || "Failed to resend invitation",
					});
				},
			},
		);
	};

	return (
		<TableRow key={invitation.id}>
			<TableCell className="">
				<span className="block truncate">{invitation.email}</span>
			</TableCell>
			<TableCell className="">
				<Badge variant="secondary">{invitation.role}</Badge>
			</TableCell>
			<TableCell className="">
				<Badge variant="outline">{invitation.status}</Badge>
			</TableCell>
			<TableCell className="">
				{invitation.expiresAt
					? new Date(invitation.expiresAt).toLocaleDateString()
					: "-"}
			</TableCell>
			<TableCell className="text-right">
				<Button
					variant="ghost"
					size="sm"
					onClick={handleResend}
					disabled={isPending}
				>
					{isPending ? "Resending" : "Resend"}
				</Button>
			</TableCell>
		</TableRow>
	);
}

export function MembersTable({ mode }: { mode: "members" | "invitations" }) {
	// const t = useTranslations("common"); // removed
	const { data: activeOrganization } = useGetFullOrganization();

	const members = activeOrganization?.members ?? [];
	const invitations = activeOrganization?.invitations ?? [];

	if (mode === "members") {
		return (
			<Table className="">
				{/* Ensure minimum width */}
				<TableHeader>
					<TableRow>
						<TableHead className="">{"Name"}</TableHead>
						<TableHead className="">{"Email"}</TableHead>
						<TableHead className="">{"Role"}</TableHead>
						<TableHead className="text-right">{"Actions"}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{members.length > 0 ? (
						members.map((m) => <MemberRow key={m.id} member={m} />)
					) : (
						<TableRow>
							<TableCell
								colSpan={4}
								className="text-center text-muted-foreground"
							>
								{"No members"}
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		);
	}

	return (
		<Table className="">
			{/* Ensure minimum width for invitations table */}
			<TableHeader>
				<TableRow>
					<TableHead className="">{"Email"}</TableHead>
					<TableHead className="">{"Role"}</TableHead>
					<TableHead className="">{"Status"}</TableHead>
					<TableHead className="">{"Expires At"}</TableHead>
					<TableHead className="text-right">{"Actions"}</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{invitations.length > 0 ? (
					invitations.map((inv) => (
						<InvitationRow key={inv.id} invitation={inv} />
					))
				) : (
					<TableRow>
						<TableCell
							colSpan={5}
							className="text-center text-muted-foreground"
						>
							{"No invitations"}
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
}
