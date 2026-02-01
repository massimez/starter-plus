"use client";

import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { Loader2 } from "lucide-react";
import * as React from "react";

export interface CreateOrganizationData {
	name: string;
	slug: string;
	type: string;
	description: string;
}

const businessTypes = [
	{ value: "retail", label: "Retail Store" },
	{ value: "services", label: "Professional Services" },
	{ value: "ecommerce", label: "E-commerce Only" },
	{ value: "other", label: "Other" },
];

export function CreateOrganizationForm({
	onSubmit,
}: {
	onSubmit: (data: CreateOrganizationData) => Promise<void>;
}) {
	const [loading, setLoading] = React.useState(false);
	const [name, setName] = React.useState("");
	const [slug, setSlug] = React.useState("");

	// Update slug when name changes
	React.useEffect(() => {
		const generatedSlug = name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with hyphens
			.replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
		setSlug(generatedSlug);
	}, [name]);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLoading(true);
		const formData = new FormData(event.currentTarget);

		try {
			await onSubmit({
				name: formData.get("name") as string,
				slug: slug,
				type: formData.get("type") as string,
				description: formData.get("description") as string,
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="border-border/50 shadow-xl">
			<CardHeader>
				<CardTitle className="text-2xl">Tell us about your business</CardTitle>
				<CardDescription>
					We'll use this information to set up your store workspace.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					id="org-form"
					onSubmit={handleSubmit}
					className="grid gap-6 md:grid-cols-2"
				>
					<div className="col-span-2 space-y-2">
						<Label htmlFor="org-name">Organization Name</Label>
						<Input
							id="org-name"
							name="name"
							placeholder="e.g. Acme Inc."
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={loading}
							required
							className="text-lg"
							minLength={2}
						/>
						<p className="text-muted-foreground text-xs">
							This will be the displayed name of your workspace.
						</p>
					</div>

					<div className="col-span-2 space-y-2">
						<Label htmlFor="org-slug" className="text-muted-foreground text-xs">
							Workspace URL Preview
						</Label>
						<div className="flex items-center rounded-md border bg-muted/50 px-3 py-2 text-muted-foreground text-sm">
							{process.env.NEXT_PUBLIC_APP_URL}/
							<span className="font-medium text-foreground">
								{slug || "..."}
							</span>
						</div>
					</div>

					<div className="col-span-2 space-y-2 md:col-span-1">
						<Label htmlFor="org-type">Business Type</Label>
						<Select name="type" required>
							<SelectTrigger id="org-type" disabled={loading}>
								<SelectValue placeholder="Select type..." />
							</SelectTrigger>
							<SelectContent>
								{businessTypes.map((type) => (
									<SelectItem key={type.value} value={type.value}>
										{type.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="col-span-2 space-y-2">
						<Label htmlFor="org-desc">Description (Optional)</Label>
						<Textarea
							id="org-desc"
							name="description"
							placeholder="Briefly describe what your business does..."
							disabled={loading}
							className="resize-none"
							rows={3}
						/>
					</div>
				</form>
			</CardContent>
			<CardFooter className="flex justify-end border-t bg-muted/5 p-6">
				<Button
					type="submit"
					form="org-form"
					disabled={loading || !name}
					size="lg"
				>
					{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					Continue
				</Button>
			</CardFooter>
		</Card>
	);
}
