import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@workspace/ui/components/tabs";
import OrganizationAdvancedTab from "./organization-advanced-tab";
import OrganizationGeneralTab from "./organization-general-tab";
import OrganizationLocationsTab from "./organization-locations-tab";
import OrganizationMembersTab from "./organization-members-tab";
import OrganizationTravelFeesTab from "./organization-travel-fees-tab";

export default async function OrganizationPage() {
	return (
		<div className="space-y-6">
			<div>
				<h3 className="font-medium text-lg">Organization</h3>
			</div>
			<Tabs defaultValue="general" className="space-y-4">
				<TabsList>
					<TabsTrigger value="general">General</TabsTrigger>
					<TabsTrigger value="travel-fees">Travel Fees</TabsTrigger>
					<TabsTrigger value="members">Members</TabsTrigger>
					<TabsTrigger value="locations">Location</TabsTrigger>
					<TabsTrigger value="advanced">Advanced</TabsTrigger>
				</TabsList>
				<TabsContent value="general" className="space-y-4">
					<OrganizationGeneralTab />
				</TabsContent>

				<TabsContent value="travel-fees" className="space-y-4">
					<OrganizationTravelFeesTab />
				</TabsContent>
				<TabsContent value="members" className="space-y-4">
					<OrganizationMembersTab />
				</TabsContent>
				<TabsContent value="locations" className="space-y-4">
					<OrganizationLocationsTab />
				</TabsContent>
				<TabsContent value="advanced" className="space-y-4">
					<OrganizationAdvancedTab />
				</TabsContent>
			</Tabs>
		</div>
	);
}
