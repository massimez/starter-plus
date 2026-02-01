"use client";

import { Building2, CheckCircle2, MapPin } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { hc } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import {
	type CreateOrganizationData,
	CreateOrganizationForm,
} from "./create-organization-form";
import { OnboardingCompletion } from "./onboarding-completion";
import { OnboardingSidebar } from "./onboarding-sidebar";
import { StoreAddressForm } from "./store-address-form";

type OnboardingStep = "create-org" | "store-address" | "complete";

const steps = [
	{
		id: "create-org",
		name: "Organization",
		description: "Business details",
		icon: Building2,
	},
	{
		id: "store-address",
		name: "Location",
		description: "Store address",
		icon: MapPin,
	},
	{
		id: "complete",
		name: "Complete",
		description: "Ready to go",
		icon: CheckCircle2,
	},
];

export function OnboardingFlow({
	onOrganizationCreated,
}: {
	onOrganizationCreated?: () => void;
}) {
	const [step, setStep] = React.useState<OnboardingStep>("create-org");
	const [createdOrgId, setCreatedOrgId] = React.useState<string | null>(null);
	const [completedSteps, setCompletedSteps] = React.useState<string[]>([]);
	// This state is local to the flow, used to control UI progress,
	// but the parent guard might handle the "session" state.

	const handleStepComplete = (stepId: string) => {
		if (!completedSteps.includes(stepId)) {
			setCompletedSteps([...completedSteps, stepId]);
		}
	};

	return (
		<div className="flex min-h-screen w-full items-center justify-center bg-linear-to-br from-background via-background to-muted/20 p-4 md:p-8">
			<div className="w-full max-w-5xl">
				<div className="grid gap-8 md:grid-cols-[280px_1fr]">
					{/* Sidebar / Progress */}
					<OnboardingSidebar
						steps={steps}
						currentStepStr={step}
						completedSteps={completedSteps}
					/>

					{/* Main Content */}
					<div className="relative">
						{step === "create-org" && (
							<div
								key="create-org"
								className="fade-in slide-in-from-right-4 animate-in duration-300"
							>
								<CreateOrganizationForm
									onSubmit={async (data: CreateOrganizationData) => {
										const { error, data: orgData } =
											await authClient.organization.create({
												name: data.name,
												slug: data.slug,
												// Metadata usage (type, description) depends on API support
												keepCurrentActiveOrganization: false,
											});

										if (error) {
											toast.error(
												error.message ?? "Failed to create organization",
											);
											return;
										}

										if (orgData?.id) {
											await authClient.organization.setActive({
												organizationId: orgData.id,
											});

											// Save additional business info
											await hc.api.organizations.info.$post({
												json: {
													businessType: data.type,
													description: data.description,
													organizationId: orgData.id,
												},
											});

											setCreatedOrgId(orgData.id);
											onOrganizationCreated?.();
											toast.success("Organization created successfully!");
											handleStepComplete("create-org");
											setStep("store-address");
										}
									}}
								/>
							</div>
						)}

						{step === "store-address" && createdOrgId && (
							<div
								key="store-address"
								className="fade-in slide-in-from-right-4 animate-in duration-300"
							>
								<StoreAddressForm
									organizationId={createdOrgId}
									onSubmit={async () => {
										handleStepComplete("store-address");
										setStep("complete");
										handleStepComplete("complete");
									}}
								/>
							</div>
						)}

						{step === "complete" && (
							<div
								key="complete"
								className="fade-in zoom-in-95 animate-in duration-500"
							>
								<OnboardingCompletion />
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
