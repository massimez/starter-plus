"use client";

import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { CheckCircle2, Mail, Package, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useSession } from "@/lib/auth-client";
import { useOrder, useOrganization } from "@/lib/hooks/use-storefront";

interface OrderItem {
	id: string;
	productName: string;
	sku: string;
	quantity: number;
	unitPrice: string;
	imageUrl?: string;
}

export default function OrderSuccessPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const orderId = searchParams.get("orderId");
	const orderNumber = searchParams.get("orderNumber");
	const { data: session } = useSession();

	const { data: org } = useOrganization("yam");
	const organizationId = org?.id;
	const userId = session?.user?.id;

	const { data: orderDetails, isLoading } = useOrder(
		{
			organizationId: organizationId || "",
			orderId: orderId || "",
			userId: userId,
		},
		!!organizationId && !!orderId && !!userId,
	);

	if (!orderId || !orderNumber) {
		return (
			<div className="mx-auto flex min-h-[60vh] items-center justify-center px-4 py-10">
				<Card className="w-full max-w-md">
					<CardContent className="flex flex-col items-center space-y-4 pt-6">
						<div className="rounded-full bg-destructive/10 p-4">
							<Package className="h-12 w-12 text-destructive" />
						</div>
						<h2 className="font-semibold text-xl">Order Not Found</h2>
						<p className="text-center text-muted-foreground text-sm">
							We couldn't find your order. Please check your email for order
							confirmation or contact support.
						</p>
						<Button onClick={() => router.push("/")}>Return Home</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-4xl space-y-8">
			{/* Success Header */}
			<div className="text-center">
				<div className="mb-6 inline-flex items-center justify-center">
					<div className="relative">
						<div className="rounded-full bg-linear-to-br from-green-500 to-emerald-600 p-6 shadow-lg">
							<CheckCircle2 className="size-8 text-white md:size-16" />
						</div>
						<div className="-z-10 absolute inset-0 animate-ping rounded-full bg-green-500/50" />
					</div>
				</div>
				<h1 className="mb-2 font-bold text-2xl md:text-4xl">
					Order Confirmed!
				</h1>
				<p className="text-base text-muted-foreground md:text-lg">
					Thank you for your purchase
				</p>
			</div>

			{/* Order Details Card */}
			<Card className="overflow-hidden border-2 border-green-500/20">
				<div className="bg-linear-to-r from-green-500/10 to-emerald-500/10 px-6 py-4">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-muted-foreground text-sm">Order Number</p>
							<p className="font-bold font-mono md:text-2xl">{orderNumber}</p>
						</div>
						{orderDetails && (
							<div className="text-left sm:text-right">
								<p className="text-muted-foreground text-sm">Total Amount</p>
								<p className="font-bold md:text-2xl">
									{new Intl.NumberFormat("en-US", {
										style: "currency",
										currency: orderDetails.currency || "USD",
									}).format(Number(orderDetails.totalAmount))}
								</p>
							</div>
						)}
					</div>
				</div>

				<CardContent className="space-y-6 p-6">
					{/* Confirmation Message */}
					<div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
						<Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
						<div className="space-y-1">
							<p className="font-medium text-sm">
								Order confirmation sent to your email
							</p>
							<p className="text-muted-foreground text-xs">
								{session?.user?.email || "your registered email address"}
							</p>
						</div>
					</div>

					{/* What's Next */}
					<div className="space-y-3">
						<h3 className="font-semibold text-lg">What's Next?</h3>
						<div className="space-y-3">
							<div className="flex items-start gap-3">
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-sm">
									1
								</div>
								<div>
									<p className="font-medium text-sm">Order Processing</p>
									<p className="text-muted-foreground text-xs">
										We're preparing your items for shipment
									</p>
								</div>
							</div>
							<div className="flex items-start gap-3">
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-sm">
									2
								</div>
								<div>
									<p className="font-medium text-sm">Shipping</p>
									<p className="text-muted-foreground text-xs">
										You'll receive a tracking number when your order ships
									</p>
								</div>
							</div>
							<div className="flex items-start gap-3">
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-sm">
									3
								</div>
								<div>
									<p className="font-medium text-sm">Delivery</p>
									<p className="text-muted-foreground text-xs">
										Your order will arrive at your doorstep
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Order Summary */}
					{isLoading ? (
						<div className="flex justify-center py-8">
							<div className="h-8 w-8 animate-spin rounded-full border-primary border-t-2" />
						</div>
					) : (
						orderDetails && (
							<div className="space-y-4">
								<h3 className="font-semibold text-lg">Order Summary</h3>
								<div className="space-y-3">
									{orderDetails.items?.map((item: OrderItem) => (
										<div
											key={item.id}
											className="flex items-center gap-4 rounded-lg border p-3"
										>
											<div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
												{item.imageUrl ? (
													<Image
														src={item.imageUrl}
														alt={item.productName}
														fill
														className="object-cover"
													/>
												) : (
													<Package className="h-8 w-8 text-muted-foreground" />
												)}
											</div>
											<div className="flex-1">
												<p className="font-medium text-sm leading-tight">
													{item.productName}
												</p>
												<p className="text-muted-foreground text-xs">
													Qty: {item.quantity} • SKU: {item.sku}
												</p>
											</div>
											<div className="text-right">
												<p className="font-semibold text-sm">
													{new Intl.NumberFormat("en-US", {
														style: "currency",
														currency: orderDetails.currency || "USD",
													}).format(Number(item.unitPrice))}
												</p>
												<p className="text-muted-foreground text-xs">
													per item
												</p>
											</div>
										</div>
									))}
								</div>

								{/* Price Breakdown */}
								<div className="space-y-2 rounded-lg bg-muted/30 p-4">
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">Subtotal</span>
										<span className="font-medium">
											{new Intl.NumberFormat("en-US", {
												style: "currency",
												currency: orderDetails.currency || "USD",
											}).format(Number(orderDetails.subtotal || 0))}
										</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">Shipping</span>
										<span className="font-medium">
											{new Intl.NumberFormat("en-US", {
												style: "currency",
												currency: orderDetails.currency || "USD",
											}).format(Number(orderDetails.shippingAmount || 0))}
										</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">Tax</span>
										<span className="font-medium">
											{new Intl.NumberFormat("en-US", {
												style: "currency",
												currency: orderDetails.currency || "USD",
											}).format(Number(orderDetails.taxAmount || 0))}
										</span>
									</div>
									<div className="border-t pt-2">
										<div className="flex justify-between">
											<span className="font-semibold">Total</span>
											<span className="font-bold text-lg">
												{new Intl.NumberFormat("en-US", {
													style: "currency",
													currency: orderDetails.currency || "USD",
												}).format(Number(orderDetails.totalAmount))}
											</span>
										</div>
									</div>
								</div>

								{/* Shipping Address */}
								{orderDetails.shippingAddress && (
									<div className="rounded-lg border p-4">
										<h4 className="mb-2 font-medium text-sm">
											Shipping Address
										</h4>
										<div className="space-y-1 text-muted-foreground text-sm">
											<p>{orderDetails.shippingAddress.street}</p>
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
				</CardContent>
			</Card>

			{/* Additional Information */}
			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<ShoppingBag className="h-5 w-5" />
							Continue Shopping
						</CardTitle>
						<CardDescription>
							Discover more amazing products in our store
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button
							onClick={() => router.push("/products")}
							variant="outline"
							className="w-full"
						>
							Browse Products
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<Package className="h-5 w-5" />
							Track Your Order
						</CardTitle>
						<CardDescription>
							Check your order status anytime in your account
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button
							onClick={() => router.push("/orders")}
							variant="outline"
							className="w-full"
						>
							Go to Orders history
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
