"use client";

import { useCallback, useEffect, useState } from "react";
import { storefrontClient } from "../storefront";

export interface ClientProfile {
	id: string;
	userId: string | null;
	organizationId: string;
	firstName: string | null;
	lastName: string | null;
	email: string;
	phone: string | null;
	addresses: Array<{
		type: "billing" | "shipping";
		street: string;
		city: string;
		country: string;
		state?: string;
		postalCode?: string;
		isDefault?: boolean;
	}> | null;
	preferredContactMethod: string | null;
	language: string | null;
	timezone: string | null;
	marketingConsent: boolean;
	gdprConsent: boolean;
	marketingConsentDate: Date | null;
	gdprConsentDate: Date | null;
	notes: string | null;
	emailVerified: boolean;
	phoneVerified: boolean;
	source: string | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date | null;
}

export function useProfile() {
	const [profile, setProfile] = useState<ClientProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [updating, setUpdating] = useState(false);

	const fetchProfile = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await storefrontClient.getMyProfile();
			// Convert string dates to Date objects
			const profileData: ClientProfile = {
				...data,
				createdAt: new Date(data.createdAt),
				updatedAt: data.updatedAt ? new Date(data.updatedAt) : null,
				marketingConsentDate: data.marketingConsentDate
					? new Date(data.marketingConsentDate)
					: null,
				gdprConsentDate: data.gdprConsentDate
					? new Date(data.gdprConsentDate)
					: null,
			} as unknown as ClientProfile;
			setProfile(profileData);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load profile");
			console.error("Error fetching profile:", err);
		} finally {
			setLoading(false);
		}
	}, []);

	const updateProfile = async (
		data: Parameters<typeof storefrontClient.updateMyProfile>[0],
	) => {
		try {
			setUpdating(true);
			setError(null);
			const updated = await storefrontClient.updateMyProfile(data);
			// Convert string dates to Date objects
			const profileData: ClientProfile = {
				...updated,
				createdAt: new Date(updated.createdAt),
				updatedAt: updated.updatedAt ? new Date(updated.updatedAt) : null,
				marketingConsentDate: updated.marketingConsentDate
					? new Date(updated.marketingConsentDate)
					: null,
				gdprConsentDate: updated.gdprConsentDate
					? new Date(updated.gdprConsentDate)
					: null,
			} as unknown as ClientProfile;
			setProfile(profileData);
			return profileData;
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to update profile";
			setError(errorMessage);
			throw err;
		} finally {
			setUpdating(false);
		}
	};

	useEffect(() => {
		fetchProfile();
	}, [fetchProfile]);

	return {
		profile,
		loading,
		error,
		updating,
		updateProfile,
		refetch: fetchProfile,
	};
}
