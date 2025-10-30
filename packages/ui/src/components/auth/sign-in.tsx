import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
	DialogDescription,
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
import { cn } from "@workspace/ui/lib/utils";
import { Loader2 } from "lucide-react";
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
	const [rememberMe, setRememberMe] = useState(false);
	return (
		<div className="">
			<DialogHeader>
				<DialogTitle>Sign In</DialogTitle>
				<DialogDescription>
					Enter your email below to login to your account
				</DialogDescription>
			</DialogHeader>
			<div className="mt-8 grid gap-4">
				<div className="grid gap-2">
					<Label htmlFor="email">Email</Label>
					<Input
						id="email"
						type="email"
						placeholder="m@example.com"
						required
						onChange={(e) => {
							setEmail(e.target.value);
						}}
						value={email}
					/>
				</div>

				<div className="grid gap-2">
					<div className="flex items-center">
						<Label htmlFor="password">Password</Label>
						<button
							className="ml-auto inline-block text-sm underline"
							onClick={() => onForgetPasswordClick()}
						>
							Forgot your password?
						</button>
					</div>

					<Input
						id="password"
						type="password"
						placeholder="password"
						autoComplete="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</div>

				<div className="flex items-center gap-2">
					<Checkbox
						id="remember"
						onClick={() => {
							setRememberMe(!rememberMe);
						}}
					/>
					<Label htmlFor="remember">Remember me</Label>
				</div>

				<Button
					type="submit"
					className="w-full"
					disabled={loading}
					onClick={async () => {
						setLoading(true);
						await onLoginClick(email, password);
						setLoading(false);
					}}
				>
					{loading ? (
						<Loader2 size={16} className="animate-spin" />
					) : (
						<p> Login </p>
					)}
				</Button>

				<div
					className={cn(
						"flex w-full items-center gap-2",
						"flex-wrap justify-between",
					)}
				>
					<Button
						variant="outline"
						className={cn("grow")}
						disabled={loading}
						onClick={async () => {
							await onSocialLoginClick("google");
						}}
					>
						<GoogleIcon />
					</Button>
					<Button
						variant="outline"
						className={cn("grow")}
						disabled={loading}
						onClick={async () => {}}
					>
						<FacebookIcon />
					</Button>
					<Button
						variant="outline"
						className={cn("grow")}
						disabled={loading}
						onClick={async () => {
							await onSocialLoginClick("tiktok");
						}}
					>
						<TikTokIcon />
					</Button>
					<Button
						variant="outline"
						className={cn("grow")}
						disabled={loading}
						onClick={async () => {
							await onSocialLoginClick("apple");
						}}
					>
						<AppleIcon />
					</Button>
				</div>
			</div>
			<DialogFooter className="flex sm:justify-start">
				<div className="mt-6 text-sm">
					Don't have an account?{" "}
					<button className="underline" onClick={() => onSignUpClick()}>
						Sign up
					</button>
				</div>
			</DialogFooter>
		</div>
	);
};
