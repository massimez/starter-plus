"use client";

import { Button } from "@workspace/ui/components/button";
import {
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import OtpInput from "@workspace/ui/components/inputs/otp"; // Corrected import for OtpInput
import { Label } from "@workspace/ui/components/label";
import { Loader2 } from "lucide-react";
import Link from "next/link"; // Import Link
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useModal } from "../modals/modal-context";

interface ResetPasswordOtpProps {
	email: string;
}

export default function ResetPasswordOtp({ email }: ResetPasswordOtpProps) {
	const [otp, setOtp] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const { closeModal, openModal } = useModal();

	const handleResetPassword = async () => {
		setLoading(true);
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
			openModal("signIn", null); // Redirect to sign-in after successful reset
		}
		setLoading(false);
	};

	return (
		<div className="">
			<DialogHeader>
				<DialogTitle>Reset Password</DialogTitle>
				<DialogDescription>
					Enter the OTP sent to your email ({email}) and your new password.
				</DialogDescription>
			</DialogHeader>
			<div className="mt-8 grid gap-4">
				<div className="grid gap-2">
					<Label htmlFor="otp">OTP</Label>
					<OtpInput
						numInputs={6} // Correct prop name
						value={otp}
						onChange={setOtp}
						renderInput={(props) => <Input {...props} />} // Render Input component
						onComplete={() => {
							// Optionally auto-submit or move focus
						}}
					/>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="new-password">New Password</Label>
					<Input
						id="new-password"
						type="password"
						placeholder="New Password"
						required
						onChange={(e) => setNewPassword(e.target.value)}
						value={newPassword}
					/>
				</div>

				<Button
					type="submit"
					className="w-full"
					disabled={loading || otp.length !== 6 || newPassword.length === 0}
					onClick={handleResetPassword}
				>
					{loading ? (
						<Loader2 size={16} className="animate-spin" />
					) : (
						<p> Reset Password </p>
					)}
				</Button>
			</div>
			<DialogFooter className="flex sm:justify-start">
				<div className="mt-6 text-sm">
					<Link
						href="#"
						className="underline"
						onClick={() => openModal("forgetPassword", null)}
					>
						Resend OTP
					</Link>
				</div>
			</DialogFooter>
		</div>
	);
}
