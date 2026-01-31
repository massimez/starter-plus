import { Button } from "@workspace/ui/components/button";
import {
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog";
import { GoogleIcon } from "@workspace/ui/components/icons/brands/GoogleIcon";

import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";

export const SignIn = ({
	onLoginClick,
	onSocialLoginClick,
	onSignUpClick,
	onForgetPasswordClick,
}: {
	onLoginClick: (email: string, password: string) => Promise<void>;
	onSocialLoginClick: (name: string) => Promise<void>;
	onSignUpClick: () => Promise<void>;
	onForgetPasswordClick: () => Promise<void>;
}) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	return (
		<div className="flex flex-col gap-6">
			<DialogHeader className="space-y-2">
				<DialogTitle className="text-center font-semibold text-2xl">
					Sign in to your account
				</DialogTitle>
			</DialogHeader>

			{/* OAuth Providers */}
			<div className="flex gap-3">
				<Button
					variant="outline"
					className="h-12 flex-1 gap-2"
					disabled={loading}
					onClick={async () => {
						await onSocialLoginClick("google");
					}}
				>
					<GoogleIcon />
					Continue with Google
				</Button>
				{/* <Button
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
				</Button> */}
			</div>

			{/* Divider */}
			<div className="relative">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-t" />
				</div>
				<div className="relative flex justify-center text-xs uppercase">
					<span className="bg-background px-2 text-muted-foreground">
						Or sign in with your email
					</span>
				</div>
			</div>

			{/* Email/Password Form */}
			<div className="space-y-4">
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
					<div className="flex items-center justify-between">
						<Label htmlFor="password" className="font-medium text-sm">
							Password
						</Label>
						<button
							type="button"
							className="font-medium text-sm underline hover:no-underline"
							onClick={() => onForgetPasswordClick()}
						>
							Forgot Password?
						</button>
					</div>

					<div className="relative">
						<Input
							id="password"
							type={showPassword ? "text" : "password"}
							placeholder="Password"
							autoComplete="current-password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
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
					disabled={loading}
					onClick={async () => {
						setLoading(true);
						await onLoginClick(email, password);
						setLoading(false);
					}}
				>
					{loading ? <Loader2 size={20} className="animate-spin" /> : "Sign in"}
				</Button>
			</div>

			<DialogFooter className="flex justify-center sm:justify-center">
				<div className="text-center text-sm">
					Don't have an account?{" "}
					<button
						type="button"
						className="font-medium underline hover:no-underline"
						onClick={() => onSignUpClick()}
					>
						Register for free
					</button>
				</div>
			</DialogFooter>
		</div>
	);
};
