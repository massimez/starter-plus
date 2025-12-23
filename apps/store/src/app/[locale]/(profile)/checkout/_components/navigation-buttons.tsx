import { Button } from "@workspace/ui/components/button";
import type { CheckoutStep, StepConfig } from "./types";

interface NavigationButtonsProps {
	currentStep: CheckoutStep;
	steps: StepConfig[];
	isSubmitting: boolean;
	itemCount: number;
	total: number;
	onNext: () => void;
	onBack: () => void;
}

export function NavigationButtons({
	currentStep,
	steps,
	isSubmitting,
	itemCount,
	total,
	onNext,
	onBack,
}: NavigationButtonsProps) {
	const shouldShowContinue = currentStep !== "review";

	return (
		<div className="flex gap-4">
			{currentStep !== "shipping" && (
				<Button
					type="button"
					variant="outline"
					onClick={onBack}
					className="h-14 flex-1 rounded-xl border-2 font-semibold text-base transition-all hover:scale-[1.02]"
				>
					Back
				</Button>
			)}
			{shouldShowContinue ? (
				<Button
					type="button"
					onClick={(e) => {
						e.preventDefault();
						onNext();
					}}
					className="h-14 flex-1 rounded-xl font-bold text-base shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
				>
					Continue to{" "}
					{steps[steps.findIndex((s) => s.id === currentStep) + 1]?.title}
				</Button>
			) : (
				<Button
					type="submit"
					className="h-14 flex-1 rounded-xl font-bold text-base shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
					disabled={isSubmitting || itemCount === 0}
				>
					{isSubmitting ? (
						<span className="flex items-center gap-2">
							<div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
							Processing Order...
						</span>
					) : (
						`Place Order • $${total.toFixed(2)}`
					)}
				</Button>
			)}
		</div>
	);
}
