// OrganizationMembersTab.tsx

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@workspace/ui/components/tabs";
import { InviteMemberForm } from "./components/invite-member-form";
import { MembersTable } from "./components/members-table";

export default async function OrganizationMembersTab() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Members</CardTitle>
				<CardDescription>
					Manage your organization members and invitations.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Tabs defaultValue="members" className="space-y-4">
					<TabsList>
						<TabsTrigger value="members">Current Members</TabsTrigger>
						<TabsTrigger value="invitations">Invitations</TabsTrigger>
					</TabsList>

					<TabsContent value="members" className="space-y-4">
						<MembersTable mode="members" />
					</TabsContent>

					<TabsContent value="invitations" className="space-y-4">
						<div className="rounded-lg border p-4">
							<h4 className="mb-4 font-semibold">Invite New Member</h4>
							<InviteMemberForm />
						</div>
						<MembersTable mode="invitations" />
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
