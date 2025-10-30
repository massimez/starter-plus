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

export const SignUp = ({
	onClickCreateAccount,
	onClickSignIn,
}: {
	onClickCreateAccount: (signUpData: {
		firstName: string;
		lastName: string;
		email: string;
		password: string;
		name: string;
	}) => Promise<void>;
	onClickSignIn: () => void;
}) => {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [passwordConfirmation, setPasswordConfirmation] = useState("");
	const [loading, setLoading] = useState(false);

	return (
		<div className="z-50 rounded-md rounded-t-none">
			<DialogHeader>
				<DialogTitle>Sign Up</DialogTitle>
				<DialogDescription>
					Enter your information to create an account
				</DialogDescription>
			</DialogHeader>
			<div className="mt-8 grid gap-4">
				<div className="grid grid-cols-2 gap-4">
					<div className="grid gap-2">
						<Label htmlFor="first-name">First name</Label>
						<Input
							id="first-name"
							placeholder="Max"
							required
							onChange={(e) => {
								setFirstName(e.target.value);
							}}
							value={firstName}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="last-name">Last name</Label>
						<Input
							id="last-name"
							placeholder="Robinson"
							required
							onChange={(e) => {
								setLastName(e.target.value);
							}}
							value={lastName}
						/>
					</div>
				</div>

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
					<Label htmlFor="password">Password</Label>
					<Input
						id="password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						autoComplete="new-password"
						placeholder="Password"
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="password">Confirm Password</Label>
					<Input
						id="password_confirmation"
						type="password"
						value={passwordConfirmation}
						onChange={(e) => setPasswordConfirmation(e.target.value)}
						autoComplete="new-password"
						placeholder="Confirm Password"
					/>
				</div>
			</div>
			<DialogFooter className="flex-col sm:flex-col">
				<div className="flex w-full justify-center border-t py-4">
					<Button
						type="submit"
						className="w-full"
						disabled={loading}
						onClick={async () => {
							setLoading(true);
							try {
								await onClickCreateAccount({
									email,
									password,
									firstName,
									lastName,
									// birthdate: new Date(birthdate),
									name: `${firstName} ${lastName}`,
									// callbackURL: "/auth/verify-email",
								});
							} finally {
								setLoading(false);
							}
						}}
					>
						{loading ? (
							<Loader2 size={16} className="animate-spin" />
						) : (
							"Create an account"
						)}
					</Button>
				</div>
				<div className="text-sm">
					Already have an account?{" "}
					<button className="underline" onClick={() => onClickSignIn()}>
						Sign In
					</button>
				</div>
			</DialogFooter>
		</div>
	);
};
