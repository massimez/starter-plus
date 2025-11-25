"use client";

import { useState } from "react";
import type { ClientProfile } from "../../lib/hooks/use-profile";

interface PrivacySettingsProps {
	profile: ClientProfile;
	onUpdate: (data: unknown) => Promise<unknown>;
	updating: boolean;
}

export function PrivacySettings({
	profile,
	onUpdate,
	updating,
}: PrivacySettingsProps) {
	const [formData, setFormData] = useState({
		gdprConsent: profile.gdprConsent,
		marketingConsent: profile.marketingConsent,
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
			setError(
				err instanceof Error
					? err.message
					: "Failed to update privacy settings",
			);
		}
	};

	const formatDate = (date: Date | null) => {
		if (!date) return "Not set";
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
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
					<p className="text-green-600 text-sm">
						Privacy settings updated successfully!
					</p>
				</div>
			)}

			<div className="space-y-6">
				{/* GDPR Consent */}
				<div className="rounded-lg border border-gray-200 p-4">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<h3 className="mb-2 font-medium text-gray-900 text-lg">
								GDPR Consent
							</h3>
							<p className="mb-3 text-gray-600 text-sm">
								I consent to the processing of my personal data in accordance
								with the General Data Protection Regulation (GDPR).
							</p>
							{profile.gdprConsentDate && (
								<p className="text-gray-500 text-xs">
									Granted on: {formatDate(profile.gdprConsentDate)}
								</p>
							)}
						</div>
						<label className="relative ml-4 inline-flex cursor-pointer items-center">
							<input
								type="checkbox"
								checked={formData.gdprConsent}
								onChange={(e) =>
									setFormData({ ...formData, gdprConsent: e.target.checked })
								}
								className="peer sr-only"
								disabled={updating}
							/>
							<div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300" />
						</label>
					</div>
				</div>

				{/* Marketing Consent */}
				<div className="rounded-lg border border-gray-200 p-4">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<h3 className="mb-2 font-medium text-gray-900 text-lg">
								Marketing Communications
							</h3>
							<p className="mb-3 text-gray-600 text-sm">
								I would like to receive marketing communications, promotional
								offers, and updates about products and services.
							</p>
							{profile.marketingConsentDate && (
								<p className="text-gray-500 text-xs">
									Granted on: {formatDate(profile.marketingConsentDate)}
								</p>
							)}
						</div>
						<label className="relative ml-4 inline-flex cursor-pointer items-center">
							<input
								type="checkbox"
								checked={formData.marketingConsent}
								onChange={(e) =>
									setFormData({
										...formData,
										marketingConsent: e.target.checked,
									})
								}
								className="peer sr-only"
								disabled={updating}
							/>
							<div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300" />
						</label>
					</div>
				</div>

				{/* Information Notice */}
				<div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
					<h4 className="mb-2 font-medium text-blue-900 text-sm">
						Your Privacy Rights
					</h4>
					<ul className="space-y-1 text-blue-800 text-sm">
						<li>• You can withdraw consent at any time</li>
						<li>• You have the right to access your personal data</li>
						<li>• You can request deletion of your data</li>
						<li>• You can export your data in a portable format</li>
					</ul>
				</div>
			</div>

			<div className="flex justify-end space-x-3">
				<button
					type="button"
					onClick={() => {
						setFormData({
							gdprConsent: profile.gdprConsent,
							marketingConsent: profile.marketingConsent,
						});
						setError(null);
					}}
					className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
					disabled={updating}
				>
					Reset
				</button>
				<button
					type="submit"
					className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
					disabled={updating}
				>
					{updating ? "Saving..." : "Save Changes"}
				</button>
			</div>
		</form>
	);
}
