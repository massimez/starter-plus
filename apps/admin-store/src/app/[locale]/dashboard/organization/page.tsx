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
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<h1 className="font-bold text-3xl tracking-tight">Organization</h1>
				<p className="text-muted-foreground">
					Manage your organization settings, members, and locations.
				</p>
			</div>
			<Tabs defaultValue="general" className="w-full space-y-6">
				<TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-5">
					<TabsTrigger value="general">General</TabsTrigger>
					<TabsTrigger value="locations">Locations</TabsTrigger>
					<TabsTrigger value="members">Members</TabsTrigger>
					<TabsTrigger value="travel-fees">Travel Fees</TabsTrigger>
					<TabsTrigger value="advanced">Advanced</TabsTrigger>
				</TabsList>
				<TabsContent value="general" className="outline-none">
					<OrganizationGeneralTab />
				</TabsContent>
				<TabsContent value="locations" className="outline-none">
					<OrganizationLocationsTab />
				</TabsContent>
				<TabsContent value="members" className="outline-none">
					<OrganizationMembersTab />
				</TabsContent>
				<TabsContent value="travel-fees" className="outline-none">
					<OrganizationTravelFeesTab />
				</TabsContent>
				<TabsContent value="advanced" className="outline-none">
					<OrganizationAdvancedTab />
				</TabsContent>
			</Tabs>
		</div>
	);
}
