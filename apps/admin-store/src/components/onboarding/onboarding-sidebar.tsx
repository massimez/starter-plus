"use client";

import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";

export interface Step {
	id: string;
	name: string;
	description: string;
	icon: LucideIcon;
}

export function OnboardingSidebar({
	steps,
	currentStepStr,
	completedSteps,
}: {
	steps: Step[];
	currentStepStr: string;
	completedSteps: string[];
}) {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h1 className="font-bold text-3xl tracking-tight">Setup</h1>
				<p className="text-muted-foreground">
					Let's get your business up and running in a few steps.
				</p>
			</div>

			<div className="relative space-y-4 before:absolute before:top-2 before:left-[19px] before:h-[calc(100%-16px)] before:w-[2px] before:bg-muted">
				{steps.map((s) => {
					const isActive = s.id === currentStepStr;
					const isCompleted = completedSteps.includes(s.id);
					const Icon = s.icon;

					return (
						<div
							key={s.id}
							className={`relative flex items-center gap-4 rounded-lg border p-3 transition-colors ${
								isActive
									? "border-primary bg-primary/5 text-primary"
									: isCompleted
										? "border-muted bg-muted/50 text-muted-foreground"
										: "border-transparent text-muted-foreground opacity-50"
							}`}
						>
							<div
								className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
									isActive
										? "border-primary bg-background text-primary"
										: isCompleted
											? "border-primary bg-primary text-primary-foreground"
											: "border-muted bg-background"
								}`}
							>
								{isCompleted ? (
									<Check className="h-5 w-5" />
								) : (
									<Icon className="h-5 w-5" />
								)}
							</div>
							<div>
								<p className="font-medium leading-none">{s.name}</p>
								<p className="mt-1 text-muted-foreground text-xs">
									{s.description}
								</p>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
