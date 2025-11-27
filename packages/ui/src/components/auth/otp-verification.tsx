import { Button } from "@workspace/ui/components/button";
import {
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import OTPInput, { type InputProps } from "@workspace/ui/components/inputs/otp";
import { useCallback, useEffect, useState } from "react";

export interface OtpVerificationProps {
	title?: string;
	description?: string;
	length?: number;
	onComplete: (otp: string) => Promise<void>;
	onSubmit: (otp: string) => Promise<void>;
	onResend?: () => Promise<{
		code?: string | undefined;
		message?: string | undefined;
		status: number;
		statusText: string;
	} | null>;
	isLoading?: boolean;
	isResending?: boolean;
	resendTimeoutDuration?: number;
	maxResendAttempts?: number;
	onResendLimitReached?: () => void;
}

export const OtpVerification = ({
	title = "OTP Verification",
	description = "Please enter the one-time password sent to your device.",
	length = 6,
	onComplete,
	onSubmit,
	onResend,
	isLoading = false,
	isResending = false,
	resendTimeoutDuration = 60, // Default 60 seconds
	maxResendAttempts = 3, // Default max 3 attempts
	onResendLimitReached,
}: OtpVerificationProps) => {
	const [otp, setOtp] = useState("");
	const [timeLeft, setTimeLeft] = useState(0);
	const [resendAttempts, setResendAttempts] = useState(0);
	const [isTimeoutActive, setIsTimeoutActive] = useState(false);

	// Timer effect
	useEffect(() => {
		if (timeLeft <= 0) {
			setIsTimeoutActive(false);
			return;
		}

		const timer = setTimeout(() => {
			setTimeLeft((prev) => prev - 1);
		}, 1000);

		return () => clearTimeout(timer);
	}, [timeLeft]);

	// Format time as MM:SS
	const formatTime = useCallback((seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	}, []);

	const handleOtpChange = (value: string) => {
		setOtp(value);
		if (value.length === length) {
			onComplete(value);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (otp.length === length) {
			await onSubmit(otp);
		}
	};

	const handleResend = async () => {
		if (!onResend || isResending || isTimeoutActive) return;
		// Check if max attempts reached
		if (resendAttempts >= maxResendAttempts) {
			onResendLimitReached?.();
			return;
		}

		await onResend();

		// Start timeout and increment attempts
		setTimeLeft(resendTimeoutDuration);
		setIsTimeoutActive(true);
		setResendAttempts((prev) => prev + 1);

		// Clear current OTP
		setOtp("");
	};

	const renderInput = (inputProps: InputProps, index: number) => (
		<Input
			{...inputProps}
			key={index}
			className="h-14 w-10 text-center font-semibold text-xl md:w-12 md:text-3xl"
		/>
	);

	// Determine if resend button should be disabled
	const isResendDisabled =
		isResending || isTimeoutActive || resendAttempts >= maxResendAttempts;

	// Generate resend button text
	const getResendButtonText = (): string => {
		if (isResending) return "Sending...";
		if (resendAttempts >= maxResendAttempts) return "Max attempts reached";
		if (isTimeoutActive) return `Resend in ${formatTime(timeLeft)}`;
		return "Resend OTP";
	};

	// Generate helper text for resend attempts
	const getResendHelperText = (): string | null => {
		if (maxResendAttempts && resendAttempts > 0) {
			const remaining = maxResendAttempts - resendAttempts;
			if (remaining > 0) {
				return `${remaining} resend attempt${remaining === 1 ? "" : "s"} remaining`;
			}
			return "No more resend attempts available";
		}
		return null;
	};

	return (
		<div className="flex flex-col gap-6">
			<DialogHeader className="space-y-2 text-center">
				<DialogTitle className="font-semibold text-2xl">{title}</DialogTitle>
				<DialogDescription className="text-muted-foreground text-sm">
					{description}
				</DialogDescription>
			</DialogHeader>
			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="flex justify-center">
					<OTPInput
						numInputs={length}
						value={otp}
						onChange={handleOtpChange}
						renderInput={renderInput}
						shouldAutoFocus
						allowedCharacterSet="numeric"
						containerStyle={"gap-1"}
						renderMiddleSeparator
					/>
				</div>

				<Button
					type="submit"
					className="h-12 w-full font-medium text-base"
					disabled={otp.length !== length || isLoading}
				>
					{isLoading ? "Verifying..." : "Verify"}
				</Button>

				{onResend && (
					<div className="space-y-2">
						<Button
							type="button"
							variant="link"
							className="w-full"
							onClick={handleResend}
							disabled={isResendDisabled}
						>
							{getResendButtonText()}
						</Button>

						{/* Helper text for resend attempts */}
						{getResendHelperText() && (
							<p className="text-center text-muted-foreground text-xs">
								{getResendHelperText()}
							</p>
						)}

						{/* Additional timeout info */}
						{isTimeoutActive && (
							<p className="text-center text-muted-foreground text-xs">
								Please wait before requesting a new code
							</p>
						)}
					</div>
				)}
			</form>
		</div>
	);
};
