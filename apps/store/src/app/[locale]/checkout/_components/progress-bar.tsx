import { Check } from "lucide-react";
import type { CheckoutStep, StepConfig } from "./types";

interface CheckoutProgressBarProps {
	currentStep: CheckoutStep;
	steps: StepConfig[];
}

export function CheckoutProgressBar({
	currentStep,
	steps,
}: CheckoutProgressBarProps) {
	return (
		<div className="mb-10">
			<div className="relative flex items-start justify-between">
				{/* Connecting Line */}
				<div className="absolute top-7 right-0 left-0 flex h-1">
					{steps.map((step, index) => {
						const isActive = step.id === currentStep;
						const isCompleted =
							steps.findIndex((s) => s.id === currentStep) > index;
						const isLast = index === steps.length - 1;

						return (
							<div
								key={`progress-line-${step.id}`}
								className={`flex-1 transition-all duration-500 ${
									isLast ? "w-0 flex-none" : ""
								}`}
							>
								<div
									className={`h-full rounded-full transition-all duration-500 ${
										isCompleted
											? "bg-linear-to-r from-green-500 to-green-600"
											: isActive
												? "bg-linear-to-r from-primary to-primary/50"
												: "bg-muted"
									}`}
								/>
							</div>
						);
					})}
				</div>

				{/* Steps */}
				{steps.map((step, index) => {
					const StepIcon = step.icon;
					const isActive = step.id === currentStep;
					const isCompleted =
						steps.findIndex((s) => s.id === currentStep) > index;

					return (
						<div
							key={step.id}
							className="relative z-10 flex flex-1 flex-col items-center"
						>
							<div
								className={`flex h-14 w-14 items-center justify-center rounded-full border-[3px] transition-all duration-300 ${
									isCompleted
										? "scale-100 border-green-500 bg-green-500 text-white shadow-green-500/30 shadow-lg"
										: isActive
											? "scale-110 border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30"
											: "border-muted bg-background text-muted-foreground"
								} ${isActive ? "ring-4 ring-primary/20" : ""}`}
							>
								{isCompleted ? (
									<Check className="h-6 w-6" />
								) : (
									<StepIcon className="h-6 w-6" />
								)}
							</div>
							<div className="mt-3 text-center">
								<span
									className={`block font-semibold text-sm transition-colors duration-300 ${
										isActive
											? "text-primary"
											: isCompleted
												? "text-green-600 dark:text-green-500"
												: "text-muted-foreground"
									}`}
								>
									{step.title}
								</span>
								<span className="mt-0.5 block text-muted-foreground text-xs">
									{isCompleted
										? "Complete"
										: isActive
											? "In Progress"
											: "Pending"}
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
