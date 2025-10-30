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
import { useState } from "react";

export const ForgetPassword = ({
	sentResetCode,
	openSignIn,
}: {
	sentResetCode: (email: string) => Promise<void>;
	openSignIn: () => void;
}) => {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);

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
						await sentResetCode(email);
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
					<button className="underline" onClick={() => openSignIn()}>
						Sign in
					</button>
				</div>
			</DialogFooter>
		</div>
	);
};
