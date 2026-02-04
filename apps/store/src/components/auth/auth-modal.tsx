"use client";

import { ForgetPassword } from "@workspace/ui/components/auth/forget-password";
import { OtpVerification } from "@workspace/ui/components/auth/otp-verification";
import { ResetPasswordOtp } from "@workspace/ui/components/auth/reset-password-otp";
import { SignIn } from "@workspace/ui/components/auth/sign-in";
import { SignUp } from "@workspace/ui/components/auth/sign-up";
import defaultTranslations from "@workspace/ui/components/auth/translations.json";
import {
	Dialog,
	DialogContent,
	DialogTitle,
} from "@workspace/ui/components/dialog";
import { useOtpVerification } from "@workspace/ui/hooks/use-otp-verification";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { authClient, signIn, signUp } from "@/lib/auth-client";

interface AuthModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultView?: "signIn" | "signUp";
	redirectTo?: string;
	onLoginSuccess?: () => void;
}

type ViewType =
	| "signIn"
	| "signUp"
	| "verificationOtp"
	| "forgetPassword"
	| "resetPasswordOtp";

export function AuthModal({
	open,
	onOpenChange,
	defaultView = "signIn",
	redirectTo,
	onLoginSuccess,
}: AuthModalProps) {
	const [view, setView] = useState<ViewType>(defaultView);
	// biome-ignore lint/suspicious/noExplicitAny: <>
	const [otpProps, setOtpProps] = useState<any>(null);
	// biome-ignore lint/suspicious/noExplicitAny: <>
	const [resetPasswordProps, setResetPasswordProps] = useState<any>(null);
	const router = useRouter();
	const locale = useLocale();
	const translations =
		defaultTranslations[locale as keyof typeof defaultTranslations] ||
		defaultTranslations.en;

	// biome-ignore lint/suspicious/noExplicitAny: <>
	const openModal = (type: string, props: any) => {
		if (type === "verificationOtp") {
			setOtpProps(props);
			setView("verificationOtp");
		}
		// Add other types if needed
	};

	const { handleVerification } = useOtpVerification({
		openModal,
		authClient,
		toast,
		router,
	});

	const handleSignIn = async (email: string, password: string) => {
		await signIn.email(
			{
				email,
				password,
			},
			{
				onSuccess: async () => {
					toast.success("Signed in successfully");
					onOpenChange(false);
					onLoginSuccess?.();
					router.refresh();
				},
				onError: (ctx) => {
					toast.error(ctx.error.message);
				},
			},
		);
	};

	const handleSocialLogin = async (provider: string) => {
		await signIn.social(
			{
				provider: provider,
				callbackURL: redirectTo || window.location.href,
			},
			{
				onError: (ctx) => {
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
		await signUp.email(
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
						onVerificationSuccess: () => {
							toast.success("Account created successfully");
							onOpenChange(false);
							onLoginSuccess?.();
							router.refresh();
						},
					});
				},
				onError: (ctx) => {
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

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex h-screen w-screen max-w-none flex-col gap-0 rounded-none p-0 sm:h-auto sm:w-full sm:max-w-[500px] sm:rounded-lg sm:p-8">
				<DialogTitle className="sr-only">Authentication</DialogTitle>
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
					<div className="w-full max-w-md sm:max-w-none">
						{view === "signIn" ? (
							<SignIn
								onLoginClick={handleSignIn}
								onSocialLoginClick={handleSocialLogin}
								onSignUpClick={async () => setView("signUp")}
								onForgetPasswordClick={async () => setView("forgetPassword")}
								translations={translations.signIn}
							/>
						) : view === "signUp" ? (
							<SignUp
								onClickCreateAccount={handleSignUp}
								onClickSignIn={() => setView("signIn")}
								onSocialLoginClick={handleSocialLogin}
								translations={translations.signUp}
							/>
						) : view === "forgetPassword" ? (
							<ForgetPassword
								sentResetCode={handleSendResetCode}
								openSignIn={() => setView("signIn")}
								translations={translations.forgetPassword}
							/>
						) : view === "resetPasswordOtp" ? (
							<ResetPasswordOtp
								{...resetPasswordProps}
								translations={translations.resetPasswordOtp}
							/>
						) : (
							<OtpVerification
								{...otpProps}
								translations={translations.otpVerification}
								title={translations.otpVerification.title}
								description={translations.otpVerification.description.replace(
									"{email}",
									otpProps?.email || "",
								)}
							/>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
