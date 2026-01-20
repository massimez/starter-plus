"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import {
	CheckCircle2,
	ChevronRight,
	Clock,
	Package,
	Search,
	ShoppingBag,
	Truck,
	XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { OrderStatusSheet } from "../features/cart/checkout/order-status-sheet";

interface Order {
	id: string;
	orderNumber: string;
	status: string;
	createdAt: string;
	totalAmount: string;
	currency: string;
}

interface OrderHistoryProps {
	orders?: Order[];
	isLoadingOrders: boolean;
}

export function OrderHistory({ orders, isLoadingOrders }: OrderHistoryProps) {
	const t = useTranslations("Profile.orders");
	const locale = useLocale();
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [sortBy, setSortBy] = useState<string>("newest");
	const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);

	const statusConfig = useMemo(
		() => ({
			pending: {
				label: t("processing"),
				variant: "warning" as const,
				icon: Clock,
				color: "text-yellow-600",
				bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
			},
			completed: {
				label: t("delivered"),
				variant: "success" as const,
				icon: CheckCircle2,
				color: "text-green-600",
				bgColor: "bg-green-50 dark:bg-green-950/20",
			},
			shipped: {
				label: t("inTransit"),
				variant: "outline" as const,
				icon: Truck,
				color: "text-blue-600",
				bgColor: "bg-blue-50 dark:bg-blue-950/20",
			},
			cancelled: {
				label: t("cancelled"),
				variant: "destructive" as const,
				icon: XCircle,
				color: "text-red-600",
				bgColor: "bg-red-50 dark:bg-red-950/20",
			},
		}),
		[t],
	);

	const handleOrderClick = (orderId: string) => {
		setSelectedOrderId(orderId);
		setSheetOpen(true);
	};

	// Filter and sort orders
	const filteredOrders = useMemo(() => {
		if (!orders) return [];

		const filtered = orders.filter((order) => {
			const matchesSearch =
				order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
				order.id.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesStatus =
				statusFilter === "all" || order.status === statusFilter;
			return matchesSearch && matchesStatus;
		});

		// Sort orders
		filtered.sort((a, b) => {
			switch (sortBy) {
				case "newest":
					return (
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
					);
				case "oldest":
					return (
						new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
					);
				case "amount-high":
					return Number(b.totalAmount) - Number(a.totalAmount);
				case "amount-low":
					return Number(a.totalAmount) - Number(b.totalAmount);
				default:
					return 0;
			}
		});

		return filtered;
	}, [orders, searchQuery, statusFilter, sortBy]);

	const getStatusConfig = (status: string) => {
		return (
			statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
		);
	};

	const selectedOrder = orders?.find((o) => o.id === selectedOrderId);

	return (
		<div className="space-y-6">
			<Card className="border-none shadow-none">
				<CardHeader className="space-y-4">
					<div>
						<CardTitle className="text-2xl">{t("title")}</CardTitle>
						<CardDescription className="mt-1.5">
							{t("description")}
						</CardDescription>
					</div>

					{/* Filters and Search */}
					{orders && orders.length > 0 && (
						<div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
							<div className="relative flex-1">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder={t("searchPlaceholder")}
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-9"
								/>
							</div>
							<div className="flex gap-2">
								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger className="w-[140px]">
										<SelectValue placeholder={t("status")} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">{t("allStatus")}</SelectItem>
										<SelectItem value="pending">{t("processing")}</SelectItem>
										<SelectItem value="shipped">{t("inTransit")}</SelectItem>
										<SelectItem value="completed">{t("delivered")}</SelectItem>
										<SelectItem value="cancelled">{t("cancelled")}</SelectItem>
									</SelectContent>
								</Select>
								<Select value={sortBy} onValueChange={setSortBy}>
									<SelectTrigger className="w-[140px]">
										<SelectValue placeholder={t("sortBy")} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="newest">{t("newest")}</SelectItem>
										<SelectItem value="oldest">{t("oldest")}</SelectItem>
										<SelectItem value="amount-high">
											{t("amountHigh")}
										</SelectItem>
										<SelectItem value="amount-low">{t("amountLow")}</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					)}
				</CardHeader>

				<CardContent className="px-0 sm:px-6">
					{isLoadingOrders ? (
						<div className="flex flex-col items-center justify-center py-16">
							<div className="relative h-12 w-12">
								<div className="absolute inset-0 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
							</div>
							<p className="mt-4 text-muted-foreground text-sm">
								{t("loading")}
							</p>
						</div>
					) : filteredOrders.length > 0 ? (
						<div className="space-y-4">
							{filteredOrders.map((order: Order) => {
								const config = getStatusConfig(order.status);
								const StatusIcon = config.icon;

								return (
									<Card
										key={order.id}
										className="group cursor-pointer overflow-hidden border transition-all duration-300 hover:border-primary/50 hover:shadow-md"
										onClick={() => handleOrderClick(order.id)}
									>
										<div className="p-5 sm:p-6">
											<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
												{/* Left Section */}
												<div className="flex flex-1 items-center gap-4 sm:gap-6">
													<div
														className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-110 ${config.bgColor}`}
													>
														<StatusIcon className={`h-6 w-6 ${config.color}`} />
													</div>
													<div className="space-y-1.5">
														<div className="flex flex-wrap items-center gap-2">
															<h3 className="font-semibold text-lg tracking-tight">
																{order.orderNumber}
															</h3>
															<Badge
																variant={config.variant}
																className="capitalize shadow-none"
															>
																{config.label}
															</Badge>
														</div>
														<div className="flex items-center gap-2 text-muted-foreground text-sm">
															<Clock className="h-3.5 w-3.5" />
															<p>
																{new Intl.DateTimeFormat(locale, {
																	dateStyle: "medium",
																	timeStyle: "short",
																}).format(new Date(order.createdAt))}
															</p>
														</div>
													</div>
												</div>

												{/* Right Section */}
												<div className="flex items-center justify-between gap-4 border-t pt-4 sm:border-t-0 sm:pt-0 sm:pl-6">
													<div className="text-left sm:text-right">
														<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
															{t("totalAmount")}
														</p>
														<p className="font-bold text-xl tracking-tight">
															{new Intl.NumberFormat(locale, {
																style: "currency",
																currency: order.currency || "USD",
																currencyDisplay: "symbol",
															}).format(Number(order.totalAmount))}
														</p>
													</div>
													<div className="rounded-full bg-muted p-2 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
														<ChevronRight className="h-5 w-5" />
													</div>
												</div>
											</div>
										</div>
									</Card>
								);
							})}
						</div>
					) : orders && orders.length > 0 ? (
						<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
							<div className="mb-4 rounded-full bg-muted p-4">
								<Search className="h-8 w-8 text-muted-foreground" />
							</div>
							<h3 className="mb-1 font-semibold text-lg">{t("noResults")}</h3>
							<p className="mb-4 max-w-sm text-muted-foreground text-sm">
								{t("noResultsDesc")}
							</p>
							<Button
								variant="outline"
								onClick={() => {
									setSearchQuery("");
									setStatusFilter("all");
								}}
							>
								{t("clearFilters")}
							</Button>
						</div>
					) : (
						<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
							<div className="relative mb-6">
								<div className="rounded-full bg-linear-to-br from-primary/20 to-primary/5 p-6">
									<ShoppingBag className="h-12 w-12 text-primary" />
								</div>
								<div className="-right-2 -top-2 absolute rounded-full bg-background p-2 shadow-lg">
									<Package className="h-6 w-6 text-muted-foreground" />
								</div>
							</div>
							<h3 className="mb-2 font-semibold text-xl">{t("empty")}</h3>
							<p className="mb-6 max-w-sm text-muted-foreground">
								{t("emptyDesc")}
							</p>
							<Button
								size="lg"
								onClick={() => router.push("/products")}
								className="gap-2"
							>
								<ShoppingBag className="h-4 w-4" />
								{t("startShopping")}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			<OrderStatusSheet
				open={sheetOpen}
				onOpenChange={setSheetOpen}
				orderId={selectedOrderId}
				orderNumber={selectedOrder?.orderNumber ?? null}
			/>
		</div>
	);
}
