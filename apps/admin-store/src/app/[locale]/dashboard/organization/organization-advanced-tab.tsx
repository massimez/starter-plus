import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { AdvancedSettingsForm } from "./forms/advanced-settings-form";

export default function OrganizationAdvancedTab() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Advanced Settings</CardTitle>
				<CardDescription>Manage organization advanced settings</CardDescription>
			</CardHeader>
			<CardContent>
				<AdvancedSettingsForm />
			</CardContent>
		</Card>
	);
}
