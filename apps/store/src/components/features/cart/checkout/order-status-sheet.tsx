"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@workspace/ui/components/sheet";
import {
	CheckCircle2,
	Clock,
	Download,
	Package,
	RefreshCw,
	Truck,
	XCircle,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useFormatPrice } from "@/lib/hooks/use-format-price";
import { useOrder } from "@/lib/hooks/use-storefront";
import { useCartStore } from "@/store/use-cart-store";

interface OrderStatusSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	orderId: string | null;
	orderNumber: string | null;
}

interface OrderItem {
	id: string;
	productName: string;
	sku: string;
	quantity: number;
	unitPrice: string;
	imageUrl?: string;
	productVariantId: string;
	locationId?: string;
}

const statusConfig = {
	pending: {
		label: "Processing",
		variant: "warning" as const,
		icon: Clock,
		color: "text-yellow-600",
		bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
		description:
			"Your order has been received and is being prepared by our team.",
	},
	completed: {
		label: "Delivered",
		variant: "success" as const,
		icon: CheckCircle2,
		color: "text-green-600",
		bgColor: "bg-green-50 dark:bg-green-950/20",
		description:
			"Your order has been delivered. We hope you enjoy your purchase!",
	},
	shipped: {
		label: "In Transit",
		variant: "outline" as const,
		icon: Truck,
		color: "text-blue-600",
		bgColor: "bg-blue-50 dark:bg-blue-950/20",
		description:
			"Your order is on its way. You can track its progress with the tracking number.",
	},
	cancelled: {
		label: "Cancelled",
		variant: "destructive" as const,
		icon: XCircle,
		color: "text-red-600",
		bgColor: "bg-red-50 dark:bg-red-950/20",
		description:
			"This order has been cancelled. If you have questions, please contact support.",
	},
};

export function OrderStatusSheet({
	open,
	onOpenChange,
	orderId,
	orderNumber,
}: OrderStatusSheetProps) {
	const t = useTranslations("Checkout.status");
	const tReview = useTranslations("Checkout.review");
	// const { data: org } = useOrganization();
	// const organizationId = org?.id;
	const { addItem } = useCartStore();
	const { formatPrice } = useFormatPrice();

	const { data: orderDetails, isLoading } = useOrder(
		{
			orderId: orderId || "",
		},
		!!orderId && open,
	);

	if (!orderId || !orderNumber) return null;

	const handleOpenChange = (newOpen: boolean) => {
		onOpenChange(newOpen);
	};

	const handleReorder = () => {
		if (!orderDetails?.items || orderDetails.items.length === 0) {
			toast.error(t("noItems"));
			return;
		}

		try {
			let addedCount = 0;

			orderDetails.items.forEach((item: OrderItem) => {
				// Add each item to the cart
				addItem({
					id: item.id,
					name: item.productName,
					price: Number(item.unitPrice),
					quantity: item.quantity,
					image: item.imageUrl,
					productVariantId: item.productVariantId,
					locationId: item.locationId || "", // organizationId removed
					variantName: undefined,
					variantSku: item.sku,
				});
				addedCount++;
			});

			toast.success(t("reorderSuccess"), {
				description: `${addedCount} item${addedCount > 1 ? "s" : ""} from order ${orderNumber} added to your cart`,
			});
		} catch {
			toast.error(t("reorderError"));
		}
	};

	const getStatusConfig = (status: string) => {
		return (
			statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
		);
	};

	const status = orderDetails?.status || "pending";
	const config = getStatusConfig(status);
	const StatusIcon = config.icon;

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<SheetContent className="w-full overflow-y-auto sm:max-w-xl">
				<SheetHeader className="text-center">
					<SheetTitle className="text-center font-bold text-2xl tracking-tight">
						{t("title")}
					</SheetTitle>
					<SheetDescription className="text-center text-base text-muted-foreground">
						Order #{orderNumber}
					</SheetDescription>
					{/* Status Badge */}
					{!isLoading && (
						<div className="mt-4 flex flex-col items-center justify-center gap-3">
							<Badge
								variant={config.variant}
								className={`gap-1.5 px-4 py-1.5 text-sm shadow-sm ${config.bgColor}`}
							>
								<StatusIcon className={`h-4 w-4 ${config.color}`} />
								<span className={`font-medium ${config.color}`}>
									{config.label}
								</span>
							</Badge>
							<div className="rounded-lg border bg-muted/40 p-3 text-center">
								<p className="max-w-sm text-balance text-muted-foreground text-sm leading-relaxed">
									{config.description}
								</p>
							</div>
						</div>
					)}
				</SheetHeader>

				<div className="mt-8 space-y-8">
					{/* Actions */}
					<div className="grid grid-cols-2 gap-4">
						<Button onClick={handleReorder} className="w-full shadow-sm">
							<RefreshCw className="mr-2 h-4 w-4" />
							{t("reorder")}
						</Button>
						<Button
							variant="outline"
							className="w-full shadow-sm"
							onClick={() => {
								toast.info(t("invoiceComingSoon"));
							}}
						>
							<Download className="mr-2 h-4 w-4" />
							{t("invoice")}
						</Button>
					</div>

					{/* Order Summary */}
					{isLoading ? (
						<div className="flex flex-col items-center justify-center py-12">
							<div className="h-8 w-8 animate-spin rounded-full border-primary border-t-2" />
							<p className="mt-4 text-muted-foreground text-sm">
								{t("loading")}
							</p>
						</div>
					) : (
						orderDetails && (
							<div className="space-y-6">
								<div className="space-y-4">
									<h3 className="font-semibold text-lg tracking-tight">
										{tReview("items")} ({orderDetails.items?.length || 0})
									</h3>
									<div className="space-y-4">
										{orderDetails.items?.map((item: OrderItem) => (
											<div
												key={item.id}
												className="flex items-start gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/20"
											>
												<div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-muted">
													{item.imageUrl ? (
														<Image
															src={item.imageUrl}
															alt={item.productName}
															fill
															className="object-cover transition-transform hover:scale-105"
														/>
													) : (
														<Package className="h-8 w-8 text-muted-foreground/50" />
													)}
												</div>
												<div className="flex-1 space-y-1">
													<p className="font-medium text-base leading-snug">
														{item.productName}
													</p>
													<div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-sm">
														<span className="inline-flex items-center gap-1">
															<span className="text-muted-foreground/70">
																{tReview("qty")}:
															</span>{" "}
															{item.quantity}
														</span>
														<span className="inline-flex items-center gap-1 border-l pl-4">
															<span className="text-muted-foreground/70">
																{tReview("sku")}:
															</span>{" "}
															{item.sku}
														</span>
													</div>
												</div>
												<div className="text-right">
													<p className="font-semibold text-base">
														{formatPrice(Number(item.unitPrice))}
													</p>
												</div>
											</div>
										))}
									</div>
								</div>

								{/* Price Breakdown */}
								<div className="space-y-3 rounded-xl border bg-muted/30 p-6">
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">
											{tReview("subtotal")}
										</span>
										<span className="font-medium">
											{formatPrice(Number(orderDetails.subtotal || 0))}
										</span>
									</div>
									{Number(orderDetails.discountAmount || 0) > 0 && (
										<div className="flex justify-between text-sm">
											<span className="text-muted-foreground">
												{tReview("discount")}
											</span>
											<span className="font-medium text-green-600">
												-{formatPrice(Number(orderDetails.discountAmount || 0))}
											</span>
										</div>
									)}
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">
											{tReview("shipping")}
										</span>
										<span className="font-medium">
											{formatPrice(Number(orderDetails.shippingAmount || 0))}
										</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">
											{tReview("tax")}
										</span>
										<span className="font-medium">
											{formatPrice(Number(orderDetails.taxAmount || 0))}
										</span>
									</div>

									<div className="my-2 border-border/50 border-t" />

									<div className="flex items-baseline justify-between pt-1">
										<span className="font-semibold text-base">
											{tReview("total")}
										</span>
										<span className="font-bold text-xl tracking-tight">
											{formatPrice(Number(orderDetails.totalAmount))}
										</span>
									</div>
								</div>

								{/* Shipping Address */}
								{orderDetails.shippingAddress && (
									<div className="rounded-xl border p-5">
										<h4 className="mb-3 flex items-center gap-2 font-semibold text-sm">
											<Truck className="h-4 w-4 text-muted-foreground" />
											{tReview("shippingAddress")}
										</h4>
										<div className="ml-2 space-y-1 border-muted border-l-2 pl-6 text-muted-foreground text-sm">
											<p className="font-medium text-foreground">
												{orderDetails.shippingAddress.street}
											</p>
											<p>
												{orderDetails.shippingAddress.city},{" "}
												{orderDetails.shippingAddress.state}{" "}
												{orderDetails.shippingAddress.zipCode}
											</p>
											<p>{orderDetails.shippingAddress.country}</p>
										</div>
									</div>
								)}
							</div>
						)
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
