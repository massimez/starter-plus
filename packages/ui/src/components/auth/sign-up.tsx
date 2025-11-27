import { Button } from "@workspace/ui/components/button";
import {
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog";
import { AppleIcon } from "@workspace/ui/components/icons/brands/AppleIcon";
import { FacebookIcon } from "@workspace/ui/components/icons/brands/FacebookIcon";
import { GoogleIcon } from "@workspace/ui/components/icons/brands/GoogleIcon";
import { TikTokIcon } from "@workspace/ui/components/icons/brands/TikTokIcon";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";

export const SignUp = ({
	onClickCreateAccount,
	onClickSignIn,
	onSocialLoginClick,
}: {
	onClickCreateAccount: (signUpData: {
		firstName: string;
		lastName: string;
		email: string;
		password: string;
		name: string;
	}) => Promise<void>;
	onClickSignIn: () => void;
	onSocialLoginClick?: (name: string) => Promise<void>;
}) => {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [passwordConfirmation, setPasswordConfirmation] = useState("");
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showPasswordConfirmation, setShowPasswordConfirmation] =
		useState(false);

	return (
		<div className="flex flex-col gap-6">
			<DialogHeader className="space-y-2 text-center">
				<DialogTitle className="text-center font-semibold text-2xl">
					Create your account
				</DialogTitle>
			</DialogHeader>

			{/* OAuth Providers */}
			{onSocialLoginClick && (
				<>
					<div className="flex gap-3">
						<Button
							variant="outline"
							className="h-12 flex-1"
							disabled={loading}
							onClick={async () => {
								await onSocialLoginClick("google");
							}}
						>
							<GoogleIcon />
						</Button>
						<Button
							variant="outline"
							className="h-12 flex-1"
							disabled={loading}
							onClick={async () => {}}
						>
							<FacebookIcon />
						</Button>
						<Button
							variant="outline"
							className="h-12 flex-1"
							disabled={loading}
							onClick={async () => {
								await onSocialLoginClick("tiktok");
							}}
						>
							<TikTokIcon />
						</Button>
						<Button
							variant="outline"
							className="h-12 flex-1"
							disabled={loading}
							onClick={async () => {
								await onSocialLoginClick("apple");
							}}
						>
							<AppleIcon />
						</Button>
					</div>

					{/* Divider */}
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-background px-2 text-muted-foreground">
								Or sign up with your email
							</span>
						</div>
					</div>
				</>
			)}

			{/* Sign Up Form */}
			<div className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="first-name" className="font-medium text-sm">
							First name
						</Label>
						<Input
							id="first-name"
							placeholder="First name"
							required
							onChange={(e) => {
								setFirstName(e.target.value);
							}}
							value={firstName}
							className="h-12"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="last-name" className="font-medium text-sm">
							Last name
						</Label>
						<Input
							id="last-name"
							placeholder="Last name"
							required
							onChange={(e) => {
								setLastName(e.target.value);
							}}
							value={lastName}
							className="h-12"
						/>
					</div>
				</div>

				<div className="space-y-2">
					<Label htmlFor="email" className="font-medium text-sm">
						Email Address
					</Label>
					<Input
						id="email"
						type="email"
						placeholder="Email Address"
						required
						onChange={(e) => {
							setEmail(e.target.value);
						}}
						value={email}
						className="h-12"
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="password" className="font-medium text-sm">
						Password
					</Label>
					<div className="relative">
						<Input
							id="password"
							type={showPassword ? "text" : "password"}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoComplete="new-password"
							placeholder="Password"
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

				<div className="space-y-2">
					<Label
						htmlFor="password_confirmation"
						className="font-medium text-sm"
					>
						Confirm Password
					</Label>
					<div className="relative">
						<Input
							id="password_confirmation"
							type={showPasswordConfirmation ? "text" : "password"}
							value={passwordConfirmation}
							onChange={(e) => setPasswordConfirmation(e.target.value)}
							autoComplete="new-password"
							placeholder="Confirm Password"
							className="h-12 pr-10"
						/>
						<button
							type="button"
							onClick={() =>
								setShowPasswordConfirmation(!showPasswordConfirmation)
							}
							className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground hover:text-foreground"
						>
							{showPasswordConfirmation ? (
								<EyeOff className="h-5 w-5" />
							) : (
								<Eye className="h-5 w-5" />
							)}
						</button>
					</div>
				</div>

				<div>
					<p className="mt-6 mb-3 text-center text-muted-foreground text-xs">
						By creating an account you agree to our terms and conditions.
					</p>
					<Button
						type="submit"
						className="h-12 w-full font-medium text-base"
						disabled={loading}
						onClick={async () => {
							setLoading(true);
							try {
								await onClickCreateAccount({
									email,
									password,
									firstName,
									lastName,
									name: `${firstName} ${lastName}`,
								});
							} finally {
								setLoading(false);
							}
						}}
					>
						{loading ? (
							<Loader2 size={20} className="animate-spin" />
						) : (
							"Create an account"
						)}
					</Button>
				</div>
			</div>

			<DialogFooter className="flex justify-center sm:justify-center">
				<div className="text-center text-sm">
					Already have an account?{" "}
					<button
						type="button"
						className="font-medium underline hover:no-underline"
						onClick={() => onClickSignIn()}
					>
						Sign in
					</button>
				</div>
			</DialogFooter>
		</div>
	);
};
