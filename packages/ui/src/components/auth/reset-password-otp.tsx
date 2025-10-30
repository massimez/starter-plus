import { Button } from "@workspace/ui/components/button";
import {
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import OtpInput from "@workspace/ui/components/inputs/otp";
import { Label } from "@workspace/ui/components/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface ResetPasswordOtpProps {
	email: string;
	handleResetPassword: (
		email: string,
		otp: string,
		newPassword: string,
	) => Promise<void>;
	onResendOtp: () => void;
}

export const ResetPasswordOtp = ({
	email,
	handleResetPassword,
	onResendOtp,
}: ResetPasswordOtpProps) => {
	const [otp, setOtp] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [loading, setLoading] = useState(false);

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
					onClick={async () => {
						setLoading(true);
						try {
							await handleResetPassword(email, otp, newPassword);
						} finally {
							setLoading(false);
						}
					}}
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
					<button className="underline" onClick={() => onResendOtp()}>
						Resend OTP
					</button>
				</div>
			</DialogFooter>
		</div>
	);
};
