"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOtpVerification } from "@/hooks/use-otp-verification";
import { Link } from "@/i18n/navigation";
import { signUp } from "@/lib/auth-client";
import { useModal } from "../modals/modal-context";
import {
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";

export default function SignUp() {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	// const [birthdate, setBirthdate] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [passwordConfirmation, setPasswordConfirmation] = useState("");
	const [image, setImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	const { openModal, modalProps } = useModal();
	const { handleVerification } = useOtpVerification();

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setImage(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

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
				{/* <div className="grid gap-2">
					<Label htmlFor="birthdate">Birthdate</Label>
					<Input
						id="birthdate"
						type="date"
						required
						onChange={(e) => {
							setBirthdate(e.target.value);
						}}
						value={birthdate}
					/>
				</div> */}
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
				{/* <div className="grid gap-2">
					<Label htmlFor="image">Profile Image (optional)</Label>
					<div className="flex items-end gap-4">
						{imagePreview && (
							<div className="relative h-16 w-16 overflow-hidden rounded-sm">
								<Image
									src={imagePreview}
									alt="Profile preview"
									layout="fill"
									objectFit="cover"
								/>
							</div>
						)}
						<div className="flex w-full items-center gap-2">
							<Input
								id="image"
								type="file"
								accept="image/*"
								onChange={handleImageChange}
								className="w-full"
							/>
							{imagePreview && (
								<X
									className="cursor-pointer"
									onClick={() => {
										setImage(null);
										setImagePreview(null);
									}}
								/>
							)}
						</div>
					</div>
				</div> */}
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
								await signUp.email(
									{
										email,
										password,
										firstName,
										lastName,
										// birthdate: new Date(birthdate),
										name: `${firstName} ${lastName}`,
										image: image ? await convertImageToBase64(image) : "",
										// callbackURL: "/auth/verify-email",
									},
									{
										onResponse: () => setLoading(false),
										onError: (ctx) => {
											setLoading(false);
											toast.error(
												ctx.error.message || "An unexpected error occurred",
											);
										},
										onSuccess: async () => {
											handleVerification({
												email,
												password,
												onVerificationSuccess: () => router.push("/dashboard"),
											});
										},
									},
								);
							} catch (error: unknown) {
								setLoading(false);
								toast.error(
									(error instanceof Error && error.message) ||
										"An unexpected error occurred.",
								);
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
					<Link
						href="#"
						className="underline"
						onClick={() => openModal("signIn", null)}
					>
						Sign In
					</Link>
				</div>
			</DialogFooter>
		</div>
	);
}

async function convertImageToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}
