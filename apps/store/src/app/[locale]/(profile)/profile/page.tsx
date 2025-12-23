"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { useMounted } from "@workspace/ui/hooks/use-mounted";
import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import { AddressManager } from "@/components/profile/address-manager";
import { PrivacySettings } from "@/components/profile/privacy-settings";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileSidebar } from "@/components/profile/profile-sidebar";
import { useSession } from "@/lib/auth-client";
import { useProfile } from "@/lib/hooks/use-profile";

export default function ProfilePage() {
	const t = useTranslations("Navigation");
	const { data: session, isPending } = useSession();
	const [activeTab, setActiveTab] = useQueryState("tab", {
		defaultValue: "overview",
		parse: (value) => {
			if (
				typeof value === "string" &&
				["overview", "settings", "addresses", "privacy"].includes(value)
			) {
				return value;
			}
			return "overview";
		},
	});
	const isClient = useMounted();

	// Fetch client profile
	const {
		profile,
		loading: profileLoading,
		updating,
		updateProfile,
	} = useProfile();

	if (isPending || !isClient) {
		return (
			<div className="flex h-[50vh] items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-primary border-t-2" />
			</div>
		);
	}

	if (!session) {
		return null;
	}

	return (
		<div className="w-full space-y-8 px-4 pb-16">
			<div className="space-y-1">
				<h2 className="font-bold text-3xl tracking-tight">{t("profile")}</h2>
				<p className="text-muted-foreground">
					Manage your account settings and preferences.
				</p>
			</div>
			<Separator className="my-6" />
			<div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
				<aside className="-mx-4 lg:mx-0 lg:w-1/5">
					<ProfileSidebar activeTab={activeTab} onTabChange={setActiveTab} />
				</aside>
				<div className="w-full flex-1">
					{activeTab === "overview" && (
						<div className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle>Profile Information</CardTitle>
									<CardDescription>Your personal details.</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid gap-1">
										<span className="font-medium text-muted-foreground text-sm">
											Name
										</span>
										<span className="font-medium">{session.user.name}</span>
									</div>
									<div className="grid gap-1">
										<span className="font-medium text-muted-foreground text-sm">
											Email
										</span>
										<span className="font-medium">{session.user.email}</span>
									</div>
								</CardContent>
							</Card>
						</div>
					)}
					{activeTab === "settings" && profile && (
						<div className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle>Personal Information</CardTitle>
									<CardDescription>
										Update your personal details.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<ProfileForm
										profile={profile}
										onUpdate={(data) =>
											updateProfile(data as Parameters<typeof updateProfile>[0])
										}
										updating={updating}
									/>
								</CardContent>
							</Card>
						</div>
					)}
					{activeTab === "addresses" && profile && (
						<div className="space-y-6">
							<Card>
								<CardContent>
									<AddressManager
										addresses={profile.addresses || []}
										onUpdate={(addresses) => updateProfile({ addresses })}
										updating={updating}
									/>
								</CardContent>
							</Card>
						</div>
					)}
					{activeTab === "privacy" && profile && (
						<div className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle>Privacy & Consent</CardTitle>
									<CardDescription>
										Manage your privacy settings and consent preferences.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<PrivacySettings
										profile={profile}
										onUpdate={(data) =>
											updateProfile(data as Parameters<typeof updateProfile>[0])
										}
										updating={updating}
									/>
								</CardContent>
							</Card>
						</div>
					)}
					{(activeTab === "settings" ||
						activeTab === "addresses" ||
						activeTab === "privacy") &&
						profileLoading && (
							<div className="flex items-center justify-center py-12">
								<div className="h-8 w-8 animate-spin rounded-full border-primary border-t-2" />
							</div>
						)}
				</div>
			</div>
		</div>
	);
}
