import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { OrganizationForm } from "./forms/org-general-form";

export default async function OrganizationGeneralTab() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>General Settings</CardTitle>
				<CardDescription>Manage organization details</CardDescription>
			</CardHeader>
			<CardContent>
				<OrganizationForm />
			</CardContent>
		</Card>
	);
}
