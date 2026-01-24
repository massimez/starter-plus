"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import {
	ArrowLeft,
	Calendar,
	DollarSign,
	Mail,
	MapPin,
	Package,
	Phone,
	ShoppingCart,
} from "lucide-react";
import { use } from "react";
import { useCurrency } from "@/app/providers/currency-provider";
import { Link } from "@/i18n/navigation";
import { useClient, useClientOrders } from "../hooks";

interface ClientDetailPageProps {
	params: Promise<{
		id: string;
		locale: string;
	}>;
}

const ClientDetailPage = ({ params }: ClientDetailPageProps) => {
	const { id } = use(params);

	const { data: client, isLoading, error } = useClient(id);
	const { data: ordersData, isLoading: ordersLoading } = useClientOrders(
		client?.userId ?? undefined,
	);
	const { formatCurrency } = useCurrency();

	if (isLoading) {
		return <div className="p-4">Loading client details...</div>;
	}

	if (error) {
		return (
			<div className="p-4">
				<div className="text-red-600">
					Error loading client: {error.message}
				</div>
				<Link href="/dashboard/store/clients">
					<Button variant="outline" className="mt-4">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Clients
					</Button>
				</Link>
			</div>
		);
	}

	if (!client) {
		return (
			<div className="p-4">
				<div>Client not found</div>
				<Link href="/dashboard/store/clients">
					<Button variant="outline" className="mt-4">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Clients
					</Button>
				</Link>
			</div>
		);
	}

	const formatDate = (date?: string | null) => {
		if (!date) return "-";
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const getFullName = () => {
		const parts = [client.firstName, client.lastName].filter(Boolean);
		return parts.length > 0 ? parts.join(" ") : "Unknown Client";
	};

	return (
		<div className="min-h-screen space-y-4 p-4">
			{/* Header Section with Gradient */}
			<div className="relative overflow-hidden rounded-xl bg-linear-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-4 shadow-sm">
				<div className="relative z-10">
					<Link href="/dashboard/store/clients">
						<Button
							variant="ghost"
							className="group mb-2 transition-all hover:bg-white/50"
						>
							<ArrowLeft className="group-hover:-translate-x-1 mr-2 h-4 w-4 transition-transform" />
							Back to Clients
						</Button>
					</Link>
					<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
						<div>
							<h1 className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text font-bold text-3xl text-transparent">
								{getFullName()}
							</h1>
							<p className="mt-1 text-muted-foreground">Client Details</p>
						</div>
						<div className="flex items-center gap-2">
							{client.isActive ? (
								<Badge className="border-green-200 bg-green-500/10 px-4 py-1.5 text-green-700 text-sm hover:bg-green-500/20">
									● Active
								</Badge>
							) : (
								<Badge
									variant="secondary"
									className="border-gray-200 bg-gray-500/10 px-4 py-1.5 text-gray-700 text-sm"
								>
									● Inactive
								</Badge>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Stats Overview Grid */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{/* Total Orders Stat */}
				<Card className="group relative overflow-hidden border-0 bg-linear-to-br from-blue-500 to-cyan-500 shadow-lg transition-all duration-300 hover:shadow-xl">
					<CardContent className="p-3">
						<div className="flex items-center justify-between">
							<div className="text-white">
								<p className="font-medium text-xs opacity-90">Total Orders</p>
								<p className="mt-1 font-bold text-2xl">
									{client.totalOrders || 0}
								</p>
							</div>
							<div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
								<ShoppingCart className="h-6 w-6 text-white" />
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Total Spent Stat */}
				<Card className="group relative overflow-hidden border-0 bg-linear-to-br from-emerald-500 to-teal-500 shadow-lg transition-all duration-300 hover:shadow-xl">
					<CardContent className="p-3">
						<div className="flex items-center justify-between">
							<div className="text-white">
								<p className="font-medium text-xs opacity-90">Total Spent</p>
								<p className="mt-1 font-bold text-2xl">
									{formatCurrency(Number(client.totalSpent))}
								</p>
							</div>
							<div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
								<DollarSign className="h-5 w-5 text-white" />
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Uncompleted Orders Stat */}
				<Card className="group relative overflow-hidden border-0 bg-linear-to-br from-orange-500 to-amber-500 shadow-lg transition-all duration-300 hover:shadow-xl">
					<CardContent className="p-3">
						<div className="flex items-center justify-between">
							<div className="text-white">
								<p className="font-medium text-xs opacity-90">
									Uncompleted Orders
								</p>
								<p className="mt-1 font-bold text-2xl">
									{client.totalUncompletedOrders || 0}
								</p>
							</div>
							<div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
								<ShoppingCart className="h-5 w-5 text-white" />
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Last Purchase Stat */}
				<Card className="group relative overflow-hidden border-0 bg-linear-to-br from-purple-500 to-pink-500 shadow-lg transition-all duration-300 hover:shadow-xl">
					<CardContent className="p-3">
						<div className="flex items-center justify-between">
							<div className="text-white">
								<p className="font-medium text-xs opacity-90">Last Purchase</p>
								<p className="mt-1 font-semibold text-base">
									{formatDate(client.lastPurchaseDate)}
								</p>
							</div>
							<div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
								<Calendar className="h-5 w-5 text-white" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Client Orders Section */}
			<Card className="border-t-4 border-t-green-500 shadow-md transition-shadow hover:shadow-lg">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-xl">
						<div className="rounded-lg bg-green-500/10 p-2">
							<Package className="h-5 w-5 text-green-600" />
						</div>
						Client Orders
					</CardTitle>
				</CardHeader>
				<CardContent>
					{ordersLoading ? (
						<div className="flex items-center justify-center py-8 text-muted-foreground">
							Loading orders...
						</div>
					) : !ordersData || ordersData.data?.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-8 text-center">
							<Package className="mb-3 h-12 w-12 text-muted-foreground/30" />
							<p className="text-muted-foreground">
								No orders found for this client
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b">
										<th className="px-2 py-3 text-left font-semibold text-sm">
											Order #
										</th>
										<th className="px-2 py-3 text-left font-semibold text-sm">
											Date
										</th>
										<th className="px-2 py-3 text-left font-semibold text-sm">
											Status
										</th>
										<th className="px-2 py-3 text-right font-semibold text-sm">
											Total
										</th>
									</tr>
								</thead>
								<tbody>
									{ordersData.data?.map((order) => (
										<tr
											key={order.id}
											className="border-b transition-colors hover:bg-muted/30"
										>
											<td className="px-2 py-3 font-medium text-sm">
												{order.orderNumber}
											</td>
											<td className="px-2 py-3 text-muted-foreground text-sm">
												{new Date(order.orderDate).toLocaleDateString()}
											</td>
											<td className="px-2 py-3">
												<Badge
													variant={
														order.status === "completed" ||
														order.status === "paid"
															? undefined
															: order.status === "pending"
																? "secondary"
																: order.status === "cancelled"
																	? "destructive"
																	: "outline"
													}
													className="capitalize"
												>
													{order.status}
												</Badge>
											</td>
											<td className="px-2 py-3 text-right font-semibold text-sm">
												{formatCurrency(Number(order.totalAmount))}
											</td>
										</tr>
									))}
								</tbody>
							</table>
							{ordersData.total > 10 && (
								<div className="mt-4 text-center text-muted-foreground text-sm">
									Showing 10 of {ordersData.total} orders
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Main Content Grid */}
			<div className="grid gap-4 lg:grid-cols-2">
				{/* Contact Information */}
				<Card className="border-t-4 border-t-indigo-500 shadow-md transition-shadow hover:shadow-lg">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-xl">
							<div className="rounded-lg bg-indigo-500/10 p-2">
								<Mail className="h-5 w-5 text-indigo-600" />
							</div>
							Contact Information
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{client.email && (
							<div className="group flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50">
								<div className="rounded-full bg-blue-500/10 p-3">
									<Mail className="h-5 w-5 text-blue-600" />
								</div>
								<div className="flex-1">
									<div className="font-semibold text-muted-foreground text-sm">
										Email
									</div>
									<div className="mt-1 break-all text-foreground">
										{client.email}
									</div>
									{client.emailVerified && (
										<Badge
											variant="outline"
											className="mt-2 border-green-200 bg-green-500/10 text-green-700"
										>
											✓ Verified
										</Badge>
									)}
								</div>
							</div>
						)}

						{client.phone && (
							<div className="group flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50">
								<div className="rounded-full bg-emerald-500/10 p-3">
									<Phone className="h-5 w-5 text-emerald-600" />
								</div>
								<div className="flex-1">
									<div className="font-semibold text-muted-foreground text-sm">
										Phone
									</div>
									<div className="mt-1 text-foreground">{client.phone}</div>
									{client.phoneVerified && (
										<Badge
											variant="outline"
											className="mt-2 border-green-200 bg-green-500/10 text-green-700"
										>
											✓ Verified
										</Badge>
									)}
								</div>
							</div>
						)}

						<Separator />

						<div className="grid gap-4 md:grid-cols-2">
							{client.preferredContactMethod && (
								<div className="space-y-1">
									<div className="font-semibold text-muted-foreground text-sm">
										Preferred Contact
									</div>
									<div className="text-foreground capitalize">
										{client.preferredContactMethod}
									</div>
								</div>
							)}

							{client.language && (
								<div className="space-y-1">
									<div className="font-semibold text-muted-foreground text-sm">
										Language
									</div>
									<div className="text-foreground uppercase">
										{client.language}
									</div>
								</div>
							)}

							{client.timezone && (
								<div className="space-y-1 md:col-span-2">
									<div className="font-semibold text-muted-foreground text-sm">
										Timezone
									</div>
									<div className="text-foreground">{client.timezone}</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Purchase Timeline */}
				<Card className="border-t-4 border-t-purple-500 shadow-md transition-shadow hover:shadow-lg">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-xl">
							<div className="rounded-lg bg-purple-500/10 p-2">
								<Calendar className="h-5 w-5 text-purple-600" />
							</div>
							Purchase Timeline
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="rounded-lg border border-purple-200 bg-linear-to-r from-purple-500/10 to-pink-500/10 p-4">
							<div className="mb-4 flex items-center gap-3">
								<div className="rounded-full bg-purple-500/20 p-2">
									<Calendar className="h-5 w-5 text-purple-600" />
								</div>
								<div className="font-semibold text-muted-foreground text-sm">
									First Purchase
								</div>
							</div>
							<div className="font-bold text-2xl text-purple-600">
								{formatDate(client.firstPurchaseDate)}
							</div>
						</div>

						<div className="rounded-lg border border-blue-100 bg-linear-to-br from-blue-50 to-indigo-50 p-4">
							<div className="mb-4 flex items-center gap-3">
								<div className="rounded-full bg-blue-500/20 p-2">
									<Calendar className="h-5 w-5 text-blue-600" />
								</div>
								<div className="font-semibold text-muted-foreground text-sm">
									Last Purchase
								</div>
							</div>
							<div className="font-bold text-2xl text-blue-600">
								{formatDate(client.lastPurchaseDate)}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Addresses */}
			{client.addresses && client.addresses.length > 0 && (
				<Card className="border-t-4 border-t-emerald-500 shadow-md transition-shadow hover:shadow-lg">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-xl">
							<div className="rounded-lg bg-emerald-500/10 p-2">
								<MapPin className="h-5 w-5 text-emerald-600" />
							</div>
							Addresses
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 md:grid-cols-2">
							{(
								client.addresses as Array<{
									type?: string;
									street?: string;
									city?: string;
									state?: string;
									postalCode?: string;
									country?: string;
								}>
							)?.map((address, index: number) => (
								<div
									key={`${address.street}-${index}`}
									className="group relative overflow-hidden rounded-xl border-2 border-muted p-6 transition-all hover:border-emerald-300 hover:shadow-md"
								>
									<div className="flex items-start gap-4">
										<div className="rounded-full bg-emerald-500/10 p-3 transition-colors group-hover:bg-emerald-500/20">
											<MapPin className="h-5 w-5 text-emerald-600" />
										</div>
										<div className="flex-1">
											{address.type && (
												<Badge
													variant="outline"
													className="mb-3 border-emerald-200 bg-emerald-500/10 text-emerald-700 capitalize"
												>
													{address.type}
												</Badge>
											)}
											<div className="space-y-1 text-sm">
												{address.street && (
													<div className="font-medium">{address.street}</div>
												)}
												{address.city && address.state && (
													<div className="text-muted-foreground">
														{address.city}, {address.state} {address.postalCode}
													</div>
												)}
												{address.country && (
													<div className="text-muted-foreground">
														{address.country}
													</div>
												)}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Preferences & Consent */}
			<Card className="border-t-4 border-t-blue-500 shadow-md transition-shadow hover:shadow-lg">
				<CardHeader>
					<CardTitle className="text-xl">Preferences & Consent</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-3">
						<div className="rounded-lg border border-blue-100 bg-linear-to-br from-blue-50 to-indigo-50 p-4">
							<div className="mb-3 font-semibold text-muted-foreground text-sm">
								Marketing Consent
							</div>
							<div className="flex flex-col gap-2">
								{client.marketingConsent ? (
									<Badge className="w-fit border-green-200 bg-green-500/10 text-green-700">
										✓ Yes
									</Badge>
								) : (
									<Badge
										variant="secondary"
										className="w-fit border-red-200 bg-red-500/10 text-red-700"
									>
										✗ No
									</Badge>
								)}
								{client.marketingConsentDate && (
									<span className="text-muted-foreground text-xs">
										{formatDate(client.marketingConsentDate)}
									</span>
								)}
							</div>
						</div>

						<div className="rounded-lg border border-purple-100 bg-linear-to-br from-purple-50 to-pink-50 p-4">
							<div className="mb-3 font-semibold text-muted-foreground text-sm">
								GDPR Consent
							</div>
							<div className="flex flex-col gap-2">
								{client.gdprConsent ? (
									<Badge className="w-fit border-green-200 bg-green-500/10 text-green-700">
										✓ Yes
									</Badge>
								) : (
									<Badge
										variant="secondary"
										className="w-fit border-red-200 bg-red-500/10 text-red-700"
									>
										✗ No
									</Badge>
								)}
								{client.gdprConsentDate && (
									<span className="text-muted-foreground text-xs">
										{formatDate(client.gdprConsentDate)}
									</span>
								)}
							</div>
						</div>

						{client.source && (
							<div className="rounded-lg border border-orange-100 bg-linear-to-br from-orange-50 to-amber-50 p-4">
								<div className="mb-3 font-semibold text-muted-foreground text-sm">
									Source
								</div>
								<Badge
									variant="outline"
									className="border-orange-200 bg-orange-500/10 text-orange-700 capitalize"
								>
									{client.source}
								</Badge>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Tags & Notes */}
			{(client.tags || client.notes) && (
				<Card className="border-t-4 border-t-amber-500 shadow-md transition-shadow hover:shadow-lg">
					<CardHeader>
						<CardTitle className="text-xl">Additional Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{client.tags &&
							Array.isArray(client.tags) &&
							client.tags.length > 0 && (
								<div>
									<div className="mb-3 font-semibold text-muted-foreground text-sm">
										Tags
									</div>
									<div className="flex flex-wrap gap-2">
										{(client.tags as string[]).map((tag: string) => (
											<Badge
												key={tag}
												variant="secondary"
												className="border-indigo-200 bg-linear-to-r from-indigo-500/10 to-purple-500/10 px-3 py-1.5 text-indigo-700 transition-colors hover:from-indigo-500/20 hover:to-purple-500/20"
											>
												{tag}
											</Badge>
										))}
									</div>
								</div>
							)}

						{client.notes && (
							<div>
								<div className="mb-3 font-semibold text-muted-foreground text-sm">
									Notes
								</div>
								<div className="rounded-lg border border-amber-200 bg-linear-to-br from-amber-50 to-orange-50 p-4 text-foreground text-sm">
									{client.notes}
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
};

export default ClientDetailPage;
