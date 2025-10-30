"use client";

import { ForgetPassword } from "@workspace/ui/components/auth/forget-password";
import { OtpVerification } from "@workspace/ui/components/auth/otp-verification";
import { ResetPasswordOtp } from "@workspace/ui/components/auth/reset-password-otp";
import { SignIn } from "@workspace/ui/components/auth/sign-in";
import { SignUp } from "@workspace/ui/components/auth/sign-up";
import { Dialog, DialogContent } from "@workspace/ui/components/dialog";
import { useOtpVerification } from "@workspace/ui/hooks/use-otp-verification";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { authClient, signIn, signUp } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/error-utils";
import { DialogAddOrganization } from "./components/dialog-create-org";
import { useModal } from "./modal-context";
import type { ModalMap } from "./types";

const useAuthHandlers = (
	handleVerification: ReturnType<
		typeof useOtpVerification
	>["handleVerification"],
	router: ReturnType<typeof useRouter>,
	openModal: (modalKey: any, params: any) => void,
	closeModal: () => void,
) => {
	const onSignInClick = React.useCallback(
		async (email: string, password: string) => {
			try {
				await signIn.email(
					{
						email,
						password,
					},
					{
						onSuccess: () => {
							router.push("/dashboard");
						},
						onError: async ({ error }) => {
							if (error.code === "EMAIL_NOT_VERIFIED") {
								await authClient.emailOtp.sendVerificationOtp({
									email,
									type: "email-verification",
								});
								handleVerification({ email, password });
							} else {
								toast.error(getErrorMessage(error));
							}
						},
					},
				);
			} catch (error: unknown) {
				toast.error(getErrorMessage(error));
			}
		},
		[handleVerification, router],
	);

	const onSocialLoginClick = React.useCallback(async (_social: string) => {
		await signIn.social(
			{
				provider: "apple",
				callbackURL: "/dashboard",
			},
			{
				onRequest: (_ctx) => {},
				onResponse: (_ctx) => {},
				onError: ({ error }) => {
					toast.error(error.message || error.statusText);
				},
			},
		);
	}, []);

	const onClickCreateAccount = React.useCallback(
		async (signUpData: any) => {
			try {
				await signUp.email(
					{
						...signUpData,
					},
					{
						onError: (ctx) => {
							toast.error(ctx.error.message || "An unexpected error occurred");
						},
						onSuccess: async () => {
							handleVerification({
								email: signUpData.email,
								password: signUpData.password,
								onVerificationSuccess: () => router.push("/dashboard"),
							});
						},
					},
				);
			} catch (error: unknown) {
				toast.error(
					(error instanceof Error && error.message) ||
						"An unexpected error occurred.",
				);
			}
		},
		[handleVerification, router],
	);

	const onSentResetCode = React.useCallback(
		async (email: string) => {
			const { error } = await authClient.forgetPassword.emailOtp({
				email,
			});

			if (error) {
				toast.error(error.message || error.statusText);
			} else {
				toast.success("Password reset OTP sent to your email.");
				openModal("resetPasswordOtp", {
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
							closeModal();
							openModal("signIn", null);
						}
					},
					onResendOtp: async () => {},
				});
			}
		},
		[openModal, closeModal],
	);

	return {
		onSignInClick,
		onSocialLoginClick,
		onClickCreateAccount,
		onSentResetCode,
	};
};

const ModalRenderer = () => {
	const { modalType, modalProps, closeModal } = useModal();

	const router = useRouter();
	const { openModal } = useModal();
	const { handleVerification } = useOtpVerification({
		openModal,
		authClient,
		toast,
		router,
	});
	const authHandlers = useAuthHandlers(
		handleVerification,
		router,
		openModal,
		closeModal,
	);

	const renderModalContent = () => {
		if (!modalType) return null;

		const modalComponents: Record<string, React.ReactElement> = {
			createOrg: <DialogAddOrganization closeModal={closeModal} />,
			signIn: (
				<SignIn
					onSocialLoginClick={authHandlers.onSocialLoginClick}
					onLoginClick={authHandlers.onSignInClick}
					onForgetPasswordClick={async () => openModal("forgetPassword", null)}
					onSignUpClick={async () => openModal("signUp", null)}
				/>
			),
			signUp: (
				<SignUp
					onClickCreateAccount={authHandlers.onClickCreateAccount}
					onClickSignIn={async () => openModal("signIn", null)}
				/>
			),
			forgetPassword: (
				<ForgetPassword
					sentResetCode={authHandlers.onSentResetCode}
					openSignIn={async () => openModal("signIn", null)}
				/>
			),
			resetPasswordOtp: (
				<ResetPasswordOtp {...(modalProps as ModalMap["resetPasswordOtp"])} />
			),
			verificationOtp: (
				<OtpVerification {...(modalProps as ModalMap["verificationOtp"])} />
			),
		};

		return modalComponents[modalType] || null;
	};

	return (
		<Dialog open={!!modalType} onOpenChange={closeModal}>
			<DialogContent>{renderModalContent()}</DialogContent>
		</Dialog>
	);
};

export default ModalRenderer;
