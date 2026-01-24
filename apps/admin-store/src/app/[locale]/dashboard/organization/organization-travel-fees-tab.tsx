import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { TravelFeesForm } from "./forms/travel-fees-form";

export default function OrganizationTravelFeesTab() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Travel Fees Settings</CardTitle>
				<CardDescription>
					Manage organization travel fees and policy
				</CardDescription>
			</CardHeader>
			<CardContent>
				<TravelFeesForm />
			</CardContent>
		</Card>
	);
}
