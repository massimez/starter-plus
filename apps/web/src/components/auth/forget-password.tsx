"use client";

import { Button } from "@workspace/ui/components/button";
import {
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client"; // Import authClient
import { useModal } from "../modals/modal-context";

export default function ForgetPassword() {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const { openModal } = useModal();

	return (
		<div className="">
			<DialogHeader>
				<DialogTitle>Forgot Password</DialogTitle>
				<DialogDescription>
					Enter your email below to receive a password reset link.
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

				<Button
					type="submit"
					className="w-full"
					disabled={loading}
					onClick={async () => {
						setLoading(true);
						const { error } = await authClient.forgetPassword.emailOtp({
							email,
						});

						if (error) {
							toast.error(error.message || error.statusText);
						} else {
							toast.success("Password reset OTP sent to your email.");
							openModal("resetPasswordOtp", { email }); // Open the new OTP verification modal
						}
						setLoading(false);
					}}
				>
					{loading ? (
						<Loader2 size={16} className="animate-spin" />
					) : (
						<p> Send Reset Link </p>
					)}
				</Button>
			</div>
			<DialogFooter className="flex sm:justify-start">
				<div className="mt-6 text-sm">
					Remember your password?{" "}
					<Link
						href="#"
						className="underline"
						onClick={() => openModal("signIn", null)}
					>
						Sign in
					</Link>
				</div>
			</DialogFooter>
		</div>
	);
}
