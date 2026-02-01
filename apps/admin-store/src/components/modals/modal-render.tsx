"use client";

import { AuthModalProvider } from "@workspace/ui/components/auth/auth-modal-provider";
import defaultTranslations from "@workspace/ui/components/auth/translations.json";
import { Dialog, DialogContent } from "@workspace/ui/components/dialog";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { DialogAddOrganization } from "./components/dialog-create-org";
import { useModal } from "./modal-context";

const ModalRenderer = () => {
	const { modalType, modalProps, closeModal } = useModal();
	const router = useRouter();
	const locale = useLocale();
	console.log(modalProps, "modalProps");

	const isAuthModal =
		modalType === "signIn" ||
		modalType === "signUp" ||
		modalType === "forgetPassword" ||
		modalType === "resetPasswordOtp" ||
		modalType === "verificationOtp";

	if (isAuthModal) {
		return (
			<AuthModalProvider
				open={true}
				onOpenChange={(open) => !open && closeModal()}
				// biome-ignore lint/suspicious/noExplicitAny: <>
				defaultView={modalType as any}
				authClient={authClient}
				router={router}
				toast={toast}
				redirectTo="/dashboard"
				translations={
					defaultTranslations[locale as keyof typeof defaultTranslations] ||
					defaultTranslations.en
				}
				onSignInSuccess={() => {
					closeModal();
					router.push("/dashboard");
				}}
				onSignUpSuccess={() => {
					closeModal();
					router.push("/dashboard");
				}}
				onPasswordResetSuccess={() => {
					// Password reset success handled in provider (switches to sign in)
				}}
			/>
		);
	}

	if (modalType === "createOrg") {
		return (
			<Dialog open={true} onOpenChange={closeModal}>
				<DialogContent>
					<DialogAddOrganization closeModal={closeModal} />
				</DialogContent>
			</Dialog>
		);
	}

	return null;
};

export default ModalRenderer;
