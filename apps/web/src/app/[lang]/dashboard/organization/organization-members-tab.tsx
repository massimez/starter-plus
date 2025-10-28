// OrganizationMembersTab.tsx

import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@workspace/ui/components/tabs";
import { getTranslations } from "next-intl/server";
import { InviteMemberForm } from "./components/invite-member-form";
import { MembersTable } from "./components/members-table";

export default async function OrganizationMembersTab() {
	const t = await getTranslations("common");

	return (
		<div className="space-y-6">
			<Tabs defaultValue="members" className="space-y-4 overflow-x-auto">
				<TabsList>
					<TabsTrigger value="members">current_members</TabsTrigger>
					<TabsTrigger value="invitations">invitations</TabsTrigger>
				</TabsList>

				<TabsContent className="overflow-visible" value="members">
					<MembersTable mode="members" />
				</TabsContent>

				<TabsContent className="overflow-visible" value="invitations">
					<div className="mb-4 space-y-4">
						<h3 className="font-semibold text-lg">invite_new_member</h3>
						<InviteMemberForm />
					</div>
					<MembersTable mode="invitations" />
				</TabsContent>
			</Tabs>
		</div>
	);
}
