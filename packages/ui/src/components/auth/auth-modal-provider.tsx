"use client";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "../dialog";
import { ForgetPassword } from "./forget-password";
import { OtpVerification, type OtpVerificationProps } from "./otp-verification";
import { ResetPasswordOtp } from "./reset-password-otp";
import { SignIn } from "./sign-in";
import { SignUp } from "./sign-up";

type ViewType =
	| "signIn"
	| "signUp"
	| "verificationOtp"
	| "forgetPassword"
	| "resetPasswordOtp";

export interface AuthModalProviderProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultView?: "signIn" | "signUp";
	// biome-ignore lint/suspicious/noExplicitAny: Better-auth client type
	authClient: any;
	onSignInSuccess?: () => void;
	onSignUpSuccess?: () => void;
	onPasswordResetSuccess?: () => void;
	router: {
		push?: (path: string) => void;
		refresh: () => void;
	};
	toast: {
		success: (message: string) => void;
		error: (message: string) => void;
		info: (message: string) => void;
	};
}

export function AuthModalProvider({
	open,
	onOpenChange,
	defaultView = "signIn",
	authClient,
	onSignInSuccess,
	onSignUpSuccess,
	onPasswordResetSuccess,
	router,
	toast,
}: AuthModalProviderProps) {
	const [view, setView] = useState<ViewType>(defaultView);
	const [otpProps, setOtpProps] = useState<OtpVerificationProps | null>(null);
	// biome-ignore lint/suspicious/noExplicitAny: <>
	const [resetPasswordProps, setResetPasswordProps] = useState<any>(null);

	// biome-ignore lint/suspicious/noExplicitAny: <>
	const openModal = (type: string, props: any) => {
		if (type === "verificationOtp") {
			setOtpProps(props);
			setView("verificationOtp");
		}
	};

	const handleVerification = async ({
		email,
		password,
		onVerificationSuccess,
	}: {
		email: string;
		password: string;
		onVerificationSuccess?: () => void;
	}) => {
		openModal("verificationOtp", {
			title: "Email Verification",
			description: `We sent a verification code to ${email}. Please enter it below.`,
			length: 6,
			onComplete: async (_otp: string) => {
				// Auto-submit on complete
			},
			onSubmit: async (otp: string) => {
				const { error } = await authClient.emailOtp.verifyEmail({
					email,
					otp,
				});

				if (error) {
					toast.error(error.message || error.statusText);
				} else {
					toast.success("Email verified successfully!");
					// Sign in after verification
					await authClient.signIn.email({
						email,
						password,
					});
					onVerificationSuccess?.();
				}
			},
			onResend: async () => {
				const { error } = await authClient.emailOtp.sendVerificationOtp({
					email,
					type: "email-verification",
				});

				if (error) {
					toast.error(error.message || error.statusText);
					return null;
				}

				toast.success("Verification code resent!");
				return { status: 200, statusText: "OK" };
			},
		});
	};

	const handleSignIn = async (email: string, password: string) => {
		await authClient.signIn.email(
			{
				email,
				password,
			},
			{
				onSuccess: () => {
					toast.success("Signed in successfully");
					onSignInSuccess?.();
				},
				onError: async (ctx: { error: { message: string; code?: string } }) => {
					if (ctx.error.code === "EMAIL_NOT_VERIFIED") {
						await authClient.emailOtp.sendVerificationOtp({
							email,
							type: "email-verification",
						});
						handleVerification({
							email,
							password,
							onVerificationSuccess: onSignInSuccess,
						});
					} else {
						toast.error(ctx.error.message);
					}
				},
			},
		);
	};

	const handleSocialLogin = async (provider: string) => {
		await authClient.signIn.social(
			{
				provider: provider,
				callbackURL: "/",
			},
			{
				onError: (ctx: { error: { message: string } }) => {
					toast.error(ctx.error.message);
				},
			},
		);
	};

	const handleSignUp = async (data: {
		email: string;
		password: string;
		firstName: string;
		lastName: string;
	}) => {
		await authClient.signUp.email(
			{
				email: data.email,
				password: data.password,
				name: `${data.firstName} ${data.lastName}`,
			},
			{
				onSuccess: () => {
					handleVerification({
						email: data.email,
						password: data.password,
						onVerificationSuccess: onSignUpSuccess,
					});
				},
				onError: (ctx: { error: { message: string } }) => {
					toast.error(ctx.error.message);
				},
			},
		);
	};

	const handleSendResetCode = async (email: string) => {
		const { error } = await authClient.forgetPassword.emailOtp({
			email,
		});

		if (error) {
			toast.error(error.message || error.statusText);
		} else {
			toast.success("Password reset OTP sent to your email.");
			setResetPasswordProps({
				email,
				handleResetPassword: async (
					email: string,
					otp: string,
					newPassword: string,
				) => {
					const { error } = await authClient.emailOtp.resetPassword({
						email,
						otp,
						password: newPassword,
					});

					if (error) {
						toast.error(error.message || error.statusText);
					} else {
						toast.success("Your password has been reset successfully!");
						setView("signIn");
						onPasswordResetSuccess?.();
					}
				},
				onResendOtp: async () => {
					const { error } = await authClient.forgetPassword.emailOtp({
						email,
					});
					if (error) {
						toast.error(error.message || error.statusText);
					} else {
						toast.success("OTP resent to your email.");
					}
				},
			});
			setView("resetPasswordOtp");
		}
	};

	const handleBack = () => {
		if (view === "signIn") {
			onOpenChange(false); // Close modal
		} else if (view === "signUp" || view === "forgetPassword") {
			setView("signIn");
		} else if (view === "resetPasswordOtp") {
			setView("forgetPassword");
		} else if (view === "verificationOtp") {
			setView("signUp");
		}
	};

	const showBackButton = true; // Always show back button on mobile
	const viewMap: Record<string, React.ReactNode> = {
		signIn: (
			<SignIn
				onLoginClick={handleSignIn}
				onSocialLoginClick={handleSocialLogin}
				onSignUpClick={async () => setView("signUp")}
				onForgetPasswordClick={async () => setView("forgetPassword")}
			/>
		),
		signUp: (
			<SignUp
				onClickCreateAccount={handleSignUp}
				onClickSignIn={() => setView("signIn")}
				onSocialLoginClick={handleSocialLogin}
			/>
		),
		forgetPassword: (
			<ForgetPassword
				sentResetCode={handleSendResetCode}
				openSignIn={() => setView("signIn")}
			/>
		),
		resetPasswordOtp: <ResetPasswordOtp {...resetPasswordProps} />,
		verificationOtp: <OtpVerification {...otpProps!} />,
	};
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex h-screen w-screen max-w-none flex-col gap-0 rounded-none p-0 sm:h-auto sm:w-full sm:max-w-[500px] sm:rounded-lg sm:p-8">
				{/* Back Button - Only on mobile */}
				{showBackButton && (
					<button
						type="button"
						onClick={handleBack}
						className="absolute top-4 left-4 z-10 rounded-full p-2 transition-colors hover:bg-accent sm:hidden"
						aria-label="Go back"
					>
						<ArrowLeft className="h-6 w-6" />
					</button>
				)}

				{/* Content Container with scroll on mobile */}
				<div className="flex flex-1 items-center justify-center overflow-y-auto p-6 sm:block sm:overflow-visible sm:p-0">
					<div className="w-full max-w-md sm:max-w-none">{viewMap[view]}</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
