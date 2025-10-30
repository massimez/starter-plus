interface UseOtpVerificationOptions {
	email: string;
	password?: string;
	onVerificationSuccess?: () => void;
}

export const useOtpVerification = ({
	openModal,
	authClient,
	toast,
	router,
}: {
	openModal: any;
	authClient: any;
	toast: any;
	router: any;
}) => {
	const verifyOtp = async (email: string, otp: string, password?: string) => {
		const { data, error } = await authClient.emailOtp.verifyEmail({
			email,
			otp,
		});

		if (error) {
			toast.error("Failed to verify", {
				description: error.code,
			});
			return false;
		}

		if (data?.user.id && password) {
			await authClient.signIn.email({ email, password });
		}

		return true;
	};

	const resendOtp = async (email: string) => {
		const { data, error } = await authClient.emailOtp.sendVerificationOtp({
			email,
			type: "email-verification",
		});

		if (data?.success) {
			toast.info("OTP sent, please check your messages");
			return null;
		}

		return error;
	};

	const handleVerification = ({
		email,
		password,
		onVerificationSuccess,
	}: UseOtpVerificationOptions) => {
		const handleOtpSubmission = async (otp: string) => {
			const success = await verifyOtp(email, otp, password);

			if (success) {
				onVerificationSuccess?.();
				router.push("/dashboard");
			}
		};

		openModal("verificationOtp", {
			email,
			onComplete: handleOtpSubmission,
			onSubmit: handleOtpSubmission,
			onResend: () => resendOtp(email),
		});
	};

	return {
		handleVerification,
		verifyOtp,
		resendOtp,
	};
};
