// Modal types and their specific props
export type ModalMap = {
	createOrg: null;
	signIn: null;
	signUp: null;
	forgetPassword: null;
	resetPasswordOtp: {
		email: string;
		handleResetPassword: (
			email: string,
			otp: string,
			newPassword: string,
		) => Promise<void>;
		onResendOtp: () => Promise<void>;
	}; // Add this line for the new OTP reset modal
	resetPassword: { title: string; description: string; email?: string };
	verificationOtp: {
		email?: string;
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
	};
};

export type ModalType = keyof ModalMap;

export interface ModalContextType {
	openModal: <T extends ModalType>(type: T, props: ModalMap[T]) => void;
	closeModal: () => void;
	modalType: ModalType | null;
	modalProps: ModalMap[ModalType] | null;
}
