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
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
	const [showPassword, setShowPassword] = useState(false);

	return (
		<div className="flex flex-col gap-6">
			<DialogHeader className="space-y-2 text-center">
				<DialogTitle className="font-semibold text-2xl">
					Reset Password
				</DialogTitle>
				<DialogDescription className="text-muted-foreground text-sm">
					Enter the OTP sent to {email} and your new password.
				</DialogDescription>
			</DialogHeader>

			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="otp" className="font-medium text-sm">
						OTP
					</Label>
					<OtpInput
						numInputs={6}
						value={otp}
						onChange={setOtp}
						renderInput={(props) => (
							<Input {...props} className="h-12 text-center" />
						)}
						onComplete={() => {
							// Optionally auto-submit or move focus
						}}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="new-password" className="font-medium text-sm">
						New Password
					</Label>
					<div className="relative">
						<Input
							id="new-password"
							type={showPassword ? "text" : "password"}
							placeholder="New Password"
							required
							onChange={(e) => setNewPassword(e.target.value)}
							value={newPassword}
							className="h-12 pr-10"
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground hover:text-foreground"
						>
							{showPassword ? (
								<EyeOff className="h-5 w-5" />
							) : (
								<Eye className="h-5 w-5" />
							)}
						</button>
					</div>
				</div>

				<Button
					type="submit"
					className="h-12 w-full font-medium text-base"
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
						<Loader2 size={20} className="animate-spin" />
					) : (
						"Reset Password"
					)}
				</Button>
			</div>

			<DialogFooter className="flex justify-center sm:justify-center">
				<div className="text-center text-sm">
					<button
						type="button"
						className="font-medium underline hover:no-underline"
						onClick={() => onResendOtp()}
					>
						Resend OTP
					</button>
				</div>
			</DialogFooter>
		</div>
	);
};
