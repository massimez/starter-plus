import { Button } from "@workspace/ui/components/button";
import {
	DialogClose,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import * as React from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export function DialogAddOrganization({
	closeModal,
}: {
	closeModal: () => void;
}) {
	const [loading, setLoading] = React.useState(false);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLoading(true);
		const formData = new FormData(event.currentTarget as HTMLFormElement);
		const { error } = await authClient.organization.create({
			keepCurrentActiveOrganization: false,
			name: (formData.get("name") as string) ?? "",
			slug: (formData.get("name") as string).toLowerCase().replace(/\s+/g, "-"),
		});

		setLoading(false);
		if (error) {
			toast.error(error.message ?? "Failed to create organization");
			return;
		}
		toast.success("Organization created successfully!");
		closeModal();
	};

	return (
		<>
			<DialogHeader>
				<DialogTitle>{"Add new organization"}</DialogTitle>
				<DialogDescription>
					{"Create a new organization to manage your projects and teams."}
				</DialogDescription>
			</DialogHeader>
			<form onSubmit={handleSubmit}>
				<div className="grid gap-4">
					<div className="grid gap-3">
						<Label htmlFor="name-1">{"Name"}</Label>
						<Input id="name-1" name="name" disabled={loading} />
					</div>
				</div>
				<DialogFooter className="mt-4">
					<DialogClose asChild>
						<Button variant="outline" type="button" disabled={loading}>
							{"Cancel"}
						</Button>
					</DialogClose>
					<Button type="submit" disabled={loading}>
						{loading ? "Saving..." : "Save changes"}
					</Button>
				</DialogFooter>
			</form>
		</>
	);
}
