"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import ForgetPassword from "../auth/forget-password";
import { OtpVerification } from "../auth/otp-verification";
import ResetPasswordOtp from "../auth/reset-password-otp"; // Import the new component
import SignIn from "../auth/sign-in";
import SignUp from "../auth/sign-up";
import { DialogAddOrganization } from "./components/dialog-create-org";
import { useModal } from "./modal-context";
import type { ModalMap } from "./types";

const ModalRenderer = () => {
	const { modalType, modalProps, closeModal } = useModal();

	console.log("ModalRenderer", { modalType, modalProps });

	return (
		<Dialog open={!!modalType} onOpenChange={closeModal}>
			<DialogContent>
				{modalType === "createOrg" && (
					<DialogAddOrganization closeModal={closeModal} />
				)}
				{modalType === "signIn" && <SignIn />}
				{modalType === "signUp" && <SignUp />}
				{modalType === "forgetPassword" && <ForgetPassword />}
				{modalType === "resetPasswordOtp" && (
					<ResetPasswordOtp {...(modalProps as ModalMap["resetPasswordOtp"])} />
				)}
				{modalType === "verificationOtp" && (
					<OtpVerification {...(modalProps as ModalMap["verificationOtp"])} />
				)}
			</DialogContent>
		</Dialog>
	);
};

export default ModalRenderer;
