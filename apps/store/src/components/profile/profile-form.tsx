"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ClientProfile } from "../../lib/hooks/use-profile";

interface ProfileFormProps {
	profile: ClientProfile;
	onUpdate: (data: unknown) => Promise<unknown>;
	updating: boolean;
}

export function ProfileForm({ profile, onUpdate, updating }: ProfileFormProps) {
	const t = useTranslations("Profile.form");
	const [formData, setFormData] = useState({
		firstName: profile.firstName || "",
		lastName: profile.lastName || "",
		email: profile.email || "",
		phone: profile.phone || "",
		language: profile.language || "",
		timezone: profile.timezone || "",
		preferredContactMethod: profile.preferredContactMethod || "email",
	});
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccess(false);

		try {
			await onUpdate(formData);
			setSuccess(true);
			setTimeout(() => setSuccess(false), 3000);
		} catch (err) {
			setError(err instanceof Error ? err.message : t("error"));
		}
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		setFormData((prev) => ({
			...prev,
			[e.target.name]: e.target.value,
		}));
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{error && (
				<div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
					<p className="text-red-600 text-sm">{error}</p>
				</div>
			)}

			{success && (
				<div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3">
					<p className="text-green-600 text-sm">{t("success")}</p>
				</div>
			)}

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<label
						htmlFor="firstName"
						className="mb-1 block font-medium text-gray-700 text-sm"
					>
						{t("firstName")}
					</label>
					<input
						type="text"
						id="firstName"
						name="firstName"
						value={formData.firstName}
						onChange={handleChange}
						className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						disabled={updating}
					/>
				</div>

				<div>
					<label
						htmlFor="lastName"
						className="mb-1 block font-medium text-gray-700 text-sm"
					>
						{t("lastName")}
					</label>
					<input
						type="text"
						id="lastName"
						name="lastName"
						value={formData.lastName}
						onChange={handleChange}
						className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						disabled={updating}
					/>
				</div>

				<div>
					<label
						htmlFor="email"
						className="mb-1 block font-medium text-gray-700 text-sm"
					>
						{t("email")}
						{profile.emailVerified && (
							<span className="ml-2 text-green-600 text-xs">
								✓ {t("verified")}
							</span>
						)}
					</label>
					<input
						type="email"
						id="email"
						name="email"
						value={formData.email}
						onChange={handleChange}
						className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						disabled={updating}
						required
					/>
				</div>

				<div>
					<label
						htmlFor="phone"
						className="mb-1 block font-medium text-gray-700 text-sm"
					>
						{t("phone")}
						{profile.phoneVerified && (
							<span className="ml-2 text-green-600 text-xs">
								✓ {t("verified")}
							</span>
						)}
					</label>
					<input
						type="tel"
						id="phone"
						name="phone"
						value={formData.phone}
						onChange={handleChange}
						placeholder="+1234567890"
						className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						disabled={updating}
					/>
				</div>

				<div>
					<label
						htmlFor="language"
						className="mb-1 block font-medium text-gray-700 text-sm"
					>
						{t("language")}
					</label>
					<select
						id="language"
						name="language"
						value={formData.language}
						onChange={handleChange}
						className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						disabled={updating}
					>
						<option value="">{t("selectLanguage")}</option>
						<option value="en">English</option>
						<option value="es">Spanish</option>
						<option value="fr">French</option>
						<option value="de">German</option>
						<option value="it">Italian</option>
					</select>
				</div>

				<div>
					<label
						htmlFor="preferredContactMethod"
						className="mb-1 block font-medium text-gray-700 text-sm"
					>
						{t("preferredContactMethod")}
					</label>
					<select
						id="preferredContactMethod"
						name="preferredContactMethod"
						value={formData.preferredContactMethod}
						onChange={handleChange}
						className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						disabled={updating}
					>
						<option value="email">Email</option>
						<option value="phone">Phone</option>
						<option value="sms">SMS</option>
					</select>
				</div>
			</div>

			<div className="flex justify-end space-x-3">
				<button
					type="button"
					onClick={() => {
						setFormData({
							firstName: profile.firstName || "",
							lastName: profile.lastName || "",
							email: profile.email || "",
							phone: profile.phone || "",
							language: profile.language || "",
							timezone: profile.timezone || "",
							preferredContactMethod: profile.preferredContactMethod || "email",
						});
						setError(null);
					}}
					className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
					disabled={updating}
				>
					{t("reset")}
				</button>
				<button
					type="submit"
					className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
					disabled={updating}
				>
					{updating ? t("saving") : t("save")}
				</button>
			</div>
		</form>
	);
}
