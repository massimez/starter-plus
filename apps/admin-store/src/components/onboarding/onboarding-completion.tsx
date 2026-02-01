"use client";

import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Check } from "lucide-react";

export function OnboardingCompletion() {
	return (
		<Card className="border-border/50 shadow-xl">
			<CardContent className="flex flex-col items-center justify-center py-10 text-center">
				<div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500">
					<Check className="h-12 w-12" />
				</div>

				<h2 className="mb-2 font-bold text-3xl">You're all set!</h2>
				<p className="mb-8 text-lg text-muted-foreground">
					Your organization and store workspace have been successfully created.
				</p>

				<div className="w-full max-w-sm space-y-3">
					<Button
						className="w-full"
						size="lg"
						onClick={() => window.location.reload()}
					>
						Go to Dashboard
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
