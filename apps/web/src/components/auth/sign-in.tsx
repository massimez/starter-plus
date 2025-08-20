"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AppleIcon } from "@/components/icons/brands/AppleIcon";
import { FacebookIcon } from "@/components/icons/brands/FacebookIcon";
import { GoogleIcon } from "@/components/icons/brands/GoogleIcon";
import { TikTokIcon } from "@/components/icons/brands/TikTokIcon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOtpVerification } from "@/hooks/use-otp-verification";
import { useRouter } from "@/i18n/navigation";
import { authClient, signIn } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/error-utils";
import { cn } from "@/lib/utils";
import { useModal } from "../modals/modal-context";
import {
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";

export default function SignIn() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	const { openModal } = useModal();
	const { handleVerification } = useOtpVerification();
	const router = useRouter();
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
						<Link
							href="#"
							className="ml-auto inline-block text-sm underline"
							onClick={() => openModal("forgetPassword", null)}
						>
							Forgot your password?
						</Link>
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
						try {
							await signIn.email(
								{
									email,
									password,
								},
								{
									onSuccess: () => {
										router.push("/dashboard");
									},
									onRequest: () => setLoading(true),
									onResponse: () => setLoading(false),
									onError: async ({ error }) => {
										setLoading(false);
										if (error.code === "EMAIL_NOT_VERIFIED") {
											await authClient.emailOtp.sendVerificationOtp({
												email,
												type: "email-verification",
											});
											handleVerification({ email, password });
										} else {
											toast.error(getErrorMessage(error));
										}
									},
								},
							);
						} catch (error: unknown) {
							setLoading(false);
							toast.error(getErrorMessage(error));
						}
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
						className={cn("flex-grow")}
						disabled={loading}
						onClick={async () => {
							await signIn.social(
								{
									provider: "google",
									callbackURL: "/dashboard",
								},
								{
									onRequest: (_ctx) => {
										setLoading(true);
									},
									onResponse: (_ctx) => {
										setLoading(false);
									},
									onError: ({ error }) => {
										toast.error(getErrorMessage(error));
									},
								},
							);
						}}
					>
						<GoogleIcon />
					</Button>
					<Button
						variant="outline"
						className={cn("flex-grow")}
						disabled={loading}
						onClick={async () => {
							await signIn.social(
								{
									provider: "facebook",
									callbackURL: "/dashboard",
								},
								{
									onRequest: (_ctx) => {
										setLoading(true);
									},
									onResponse: (_ctx) => {
										setLoading(false);
									},
									onError: ({ error }) => {
										toast.error(getErrorMessage(error));
									},
								},
							);
						}}
					>
						<FacebookIcon />
					</Button>
					<Button
						variant="outline"
						className={cn("flex-grow")}
						disabled={loading}
						onClick={async () => {
							await signIn.social(
								{
									provider: "tiktok",
									callbackURL: "/dashboard",
								},
								{
									onRequest: () => {
										setLoading(true);
									},
									onResponse: () => {
										setLoading(false);
									},
									onError: ({ error }) => {
										toast.error(getErrorMessage(error));
									},
								},
							);
						}}
					>
						<TikTokIcon />
					</Button>
					<Button
						variant="outline"
						className={cn("flex-grow")}
						disabled={loading}
						onClick={async () => {
							await signIn.social(
								{
									provider: "apple",
									callbackURL: "/dashboard",
								},
								{
									onRequest: (_ctx) => {
										setLoading(true);
									},
									onResponse: (_ctx) => {
										setLoading(false);
									},
									onError: ({ error }) => {
										toast.error(error.message || error.statusText);
									},
								},
							);
						}}
					>
						<AppleIcon />
					</Button>
				</div>
			</div>
			<DialogFooter className="flex sm:justify-start">
				<div className="mt-6 text-sm">
					Don't have an account?{" "}
					<Link
						href="#"
						className="underline"
						onClick={() => openModal("signUp", null)}
					>
						Sign up
					</Link>
				</div>
			</DialogFooter>
		</div>
	);
}
