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
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
	useActiveOrganization,
	useGetFullOrganization,
	useResendInvitation,
} from "../queries";

function MemberRow({ member }: { member: any }) {
	const t = useTranslations("common");
	return (
		<TableRow key={member.id}>
			<TableCell className="">
				<div className="flex items-center gap-2">
					<Avatar className="h-8 w-8 flex-shrink-0">
						<AvatarImage src={member.user?.image ?? ""} />
						<AvatarFallback>{member.user?.name?.[0] ?? "?"}</AvatarFallback>
					</Avatar>
					<span className="truncate">{member.user?.name ?? t("unknown")}</span>
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
					{t("edit")}
				</Button>
			</TableCell>
		</TableRow>
	);
}

function InvitationRow({ invitation }: { invitation: any }) {
	const t = useTranslations("common");
	const { activeOrganization } = useActiveOrganization();
	const { mutate: resendInvitation, isPending } = useResendInvitation();

	const handleResend = () => {
		if (!activeOrganization?.id) {
			toast.error(t("error"), {
				description: t("organization_not_found"),
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
					toast.success(t("success"), {
						description: t("invitation_resent_successfully"),
					});
				},
				onError: (error) => {
					toast.error(t("error"), {
						description: error.message || t("failed_to_resend_invitation"),
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
					{isPending ? t("resending") : t("resend")}
				</Button>
			</TableCell>
		</TableRow>
	);
}

export function MembersTable({ mode }: { mode: "members" | "invitations" }) {
	const t = useTranslations("common");
	const { data: activeOrganization } = useGetFullOrganization();

	const members = activeOrganization?.members ?? [];
	const invitations = activeOrganization?.invitations ?? [];

	if (mode === "members") {
		return (
			<Table className="">
				{" "}
				{/* Ensure minimum width */}
				<TableHeader>
					<TableRow>
						<TableHead className="">{t("name")}</TableHead>
						<TableHead className="">{t("email")}</TableHead>
						<TableHead className="">{t("role")}</TableHead>
						<TableHead className="text-right">{t("actions")}</TableHead>
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
								{t("no_members")}
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		);
	}

	return (
		<Table className="">
			{" "}
			{/* Ensure minimum width for invitations table */}
			<TableHeader>
				<TableRow>
					<TableHead className="">{t("email")}</TableHead>
					<TableHead className="">{t("role")}</TableHead>
					<TableHead className="">{t("status")}</TableHead>
					<TableHead className="">{t("expires_at")}</TableHead>
					<TableHead className="text-right">{t("actions")}</TableHead>
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
							{t("no_invitations")}
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
}
