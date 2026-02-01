"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";
import { authClient } from "@/lib/auth-client";
import { OnboardingFlow } from "./onboarding/onboarding-flow";

export function OrganizationGuard({ children }: { children: React.ReactNode }) {
	const { data: session, isPending: sessionLoading } = authClient.useSession();
	const { data: listOrganizations, isPending: orgsLoading } =
		authClient.useListOrganizations();

	const [setupInProgress, setSetupInProgress] = React.useState(false);

	// Redirect to sign-in if not authenticated
	React.useEffect(() => {
		if (!sessionLoading && !session) {
			// window.location.href = "/";
		}
	}, [session, sessionLoading]);

	// Check if user has organizations
	const hasOrganizations =
		!orgsLoading && listOrganizations && listOrganizations.length > 0;

	// Show loading state
	if (sessionLoading || orgsLoading) {
		return (
			<div className="flex h-screen w-full items-center justify-center bg-linear-to-br from-background via-background to-muted/20">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="h-12 w-12 animate-spin text-primary" />
					<p className="animate-pulse font-medium text-muted-foreground">
						Loading your dashboard...
					</p>
				</div>
			</div>
		);
	}

	// Show onboarding if no organizations OR if setup is in progress
	if (!hasOrganizations || setupInProgress) {
		return (
			<OnboardingFlow onOrganizationCreated={() => setSetupInProgress(true)} />
		);
	}

	// Render children if user has organizations
	return <>{children}</>;
}
