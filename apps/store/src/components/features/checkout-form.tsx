"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Separator } from "@workspace/ui/components/separator";
import { AlertCircle, Check, CreditCard, Shield, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useSession } from "@/lib/auth-client";
import { storefrontClient } from "@/lib/storefront";
import { useCartStore } from "@/store/use-cart-store";

type CheckoutStep = "shipping" | "payment" | "review";

interface CheckoutFormProps {
	organizationId: string;
	locationId: string;
	currency?: string;
}

export function CheckoutForm({
	organizationId,
	locationId,
	currency = "USD",
}: CheckoutFormProps) {
	const { items, total, clearCart } = useCartStore();
	const { data: session } = useSession();
	const router = useRouter();
	const [currentStep, setCurrentStep] = useState<CheckoutStep>("shipping");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [shippingAddress, setShippingAddress] = useState({
		street: "",
		city: "",
		state: "",
		country: "",
		postalCode: "",
	});

	const [billingAddress, setBillingAddress] = useState({
		street: "",
		city: "",
		state: "",
		country: "",
		postalCode: "",
	});

	const [customerInfo, setCustomerInfo] = useState({
		email: session?.user?.email || "",
		phone: "",
		fullName: session?.user?.name || "",
	});

	const [useDifferentBilling, setUseDifferentBilling] = useState(false);
	const [couponCode, setCouponCode] = useState("");
	const [paymentMethod, setPaymentMethod] = useState("card");

	const steps = [
		{ id: "shipping", title: "Shipping", icon: Truck },
		{ id: "payment", title: "Payment", icon: CreditCard },
		{ id: "review", title: "Review", icon: Check },
	];

	const nextStep = () => {
		if (currentStep === "shipping") setCurrentStep("payment");
		else if (currentStep === "payment") setCurrentStep("review");
	};

	const prevStep = () => {
		if (currentStep === "payment") setCurrentStep("shipping");
		else if (currentStep === "review") setCurrentStep("payment");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			// Validate that we have items
			if (items.length === 0) {
				toast.error("Your cart is empty");
				return;
			}

			// Create order
			const order = await storefrontClient.createOrder({
				organizationId,
				locationId,
				currency,
				shippingAddress,
				customerEmail: customerInfo.email,
				customerPhone: customerInfo.phone,
				customerFullName: customerInfo.fullName,
				userId: session?.user?.id,
				items: items.map((item) => ({
					productVariantId: item.productVariantId,
					quantity: item.quantity,
					locationId: item.locationId,
				})),
			});

			// Clear cart on success
			clearCart();

			toast.success(
				`Order placed successfully! Order number: ${order.orderNumber}`,
			);

			// Redirect to order confirmation or orders page
			router.push("/profile");
		} catch (error) {
			console.error("Error creating order:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to create order",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const renderProgressBar = () => (
		<div className="mb-8">
			<div className="mb-4 flex items-center justify-between">
				{steps.map((step, index) => {
					const StepIcon = step.icon;
					const isActive = step.id === currentStep;
					const isCompleted =
						steps.findIndex((s) => s.id === currentStep) > index;
					const isUpcoming =
						steps.findIndex((s) => s.id === currentStep) < index;

					return (
						<div key={step.id} className="flex flex-1 flex-col items-center">
							<div
								className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
									isCompleted
										? "border-green-500 bg-green-500 text-white"
										: isActive
											? "border-primary bg-primary text-primary-foreground"
											: "border-muted-foreground text-muted-foreground"
								}`}
							>
								<StepIcon className="h-5 w-5" />
							</div>
							<span
								className={`mt-2 font-medium text-sm ${
									isActive
										? "text-primary"
										: isCompleted
											? "text-green-600"
											: "text-muted-foreground"
								}`}
							>
								{step.title}
							</span>
						</div>
					);
				})}
			</div>
			<div className="flex">
				{steps.map((step) => {
					const isActive = step.id === currentStep;
					const isCompleted =
						steps.findIndex((s) => s.id === currentStep) >
						steps.findIndex((s) => s.id === step.id);
					return (
						<div
							key={`progress-${step.id}`}
							className={`h-1 flex-1 ${
								isCompleted
									? "bg-green-500"
									: isActive
										? "bg-primary"
										: "bg-muted"
							}`}
						/>
					);
				})}
			</div>
		</div>
	);

	const renderShippingStep = () => (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Truck className="h-5 w-5" />
						Shipping Address
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label htmlFor="street">Street Address *</Label>
						<Input
							id="street"
							required
							placeholder="123 Main Street"
							value={shippingAddress.street}
							onChange={(e) =>
								setShippingAddress({
									...shippingAddress,
									street: e.target.value,
								})
							}
						/>
					</div>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<Label htmlFor="city">City *</Label>
							<Input
								id="city"
								required
								placeholder="New York"
								value={shippingAddress.city}
								onChange={(e) =>
									setShippingAddress({
										...shippingAddress,
										city: e.target.value,
									})
								}
							/>
						</div>
						<div>
							<Label htmlFor="state">State/Province *</Label>
							<Input
								id="state"
								required
								placeholder="NY"
								value={shippingAddress.state}
								onChange={(e) =>
									setShippingAddress({
										...shippingAddress,
										state: e.target.value,
									})
								}
							/>
						</div>
					</div>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<Label htmlFor="country">Country *</Label>
							<Input
								id="country"
								required
								placeholder="United States"
								value={shippingAddress.country}
								onChange={(e) =>
									setShippingAddress({
										...shippingAddress,
										country: e.target.value,
									})
								}
							/>
						</div>
						<div>
							<Label htmlFor="postalCode">Postal Code *</Label>
							<Input
								id="postalCode"
								required
								placeholder="10001"
								value={shippingAddress.postalCode}
								onChange={(e) =>
									setShippingAddress({
										...shippingAddress,
										postalCode: e.target.value,
									})
								}
							/>
						</div>
					</div>

					<div className="flex items-center space-x-2 pt-4">
						<Checkbox
							id="different-billing"
							checked={useDifferentBilling}
							onCheckedChange={(checked) => setUseDifferentBilling(!!checked)}
						/>
						<Label htmlFor="different-billing" className="font-normal text-sm">
							Use different billing address
						</Label>
					</div>
				</CardContent>
			</Card>

			{useDifferentBilling && (
				<Card>
					<CardHeader>
						<CardTitle>Billing Address</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<Label htmlFor="billing-street">Street Address *</Label>
							<Input
								id="billing-street"
								required
								placeholder="123 Main Street"
								value={billingAddress.street}
								onChange={(e) =>
									setBillingAddress({
										...billingAddress,
										street: e.target.value,
									})
								}
							/>
						</div>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div>
								<Label htmlFor="billing-city">City *</Label>
								<Input
									id="billing-city"
									required
									placeholder="New York"
									value={billingAddress.city}
									onChange={(e) =>
										setBillingAddress({
											...billingAddress,
											city: e.target.value,
										})
									}
								/>
							</div>
							<div>
								<Label htmlFor="billing-state">State/Province *</Label>
								<Input
									id="billing-state"
									required
									placeholder="NY"
									value={billingAddress.state}
									onChange={(e) =>
										setBillingAddress({
											...billingAddress,
											state: e.target.value,
										})
									}
								/>
							</div>
						</div>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div>
								<Label htmlFor="billing-country">Country *</Label>
								<Input
									id="billing-country"
									required
									placeholder="United States"
									value={billingAddress.country}
									onChange={(e) =>
										setBillingAddress({
											...billingAddress,
											country: e.target.value,
										})
									}
								/>
							</div>
							<div>
								<Label htmlFor="billing-postalCode">Postal Code *</Label>
								<Input
									id="billing-postalCode"
									required
									placeholder="10001"
									value={billingAddress.postalCode}
									onChange={(e) =>
										setBillingAddress({
											...billingAddress,
											postalCode: e.target.value,
										})
									}
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);

	const renderPaymentStep = () => (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CreditCard className="h-5 w-5" />
						Payment Method
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-lg border bg-blue-50 p-6 dark:bg-blue-950/20">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white">
								<span className="font-bold text-lg">$</span>
							</div>
							<div>
								<h3 className="font-semibold">Cash on Delivery</h3>
								<p className="text-muted-foreground text-sm">
									Pay when your order arrives at your doorstep
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Contact Information</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label htmlFor="fullName">Full Name *</Label>
						<Input
							id="fullName"
							required
							placeholder="John Doe"
							value={customerInfo.fullName}
							onChange={(e) =>
								setCustomerInfo({ ...customerInfo, fullName: e.target.value })
							}
						/>
					</div>
					<div>
						<Label htmlFor="email">Email Address *</Label>
						<Input
							id="email"
							type="email"
							required
							placeholder="john@example.com"
							value={customerInfo.email}
							onChange={(e) =>
								setCustomerInfo({ ...customerInfo, email: e.target.value })
							}
						/>
					</div>
					<div>
						<Label htmlFor="phone">Phone Number *</Label>
						<Input
							id="phone"
							type="tel"
							required
							placeholder="(555) 123-4567"
							value={customerInfo.phone}
							onChange={(e) =>
								setCustomerInfo({ ...customerInfo, phone: e.target.value })
							}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);

	const renderReviewStep = () => (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Order Review</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Shipping Address Summary */}
					<div>
						<h3 className="mb-2 font-semibold">Shipping Address</h3>
						<div className="rounded bg-muted p-3 text-muted-foreground text-sm">
							<p>{customerInfo.fullName}</p>
							<p>{shippingAddress.street}</p>
							<p>
								{shippingAddress.city}, {shippingAddress.state}{" "}
								{shippingAddress.postalCode}
							</p>
							<p>{shippingAddress.country}</p>
							<p className="mt-2">{customerInfo.email}</p>
							{customerInfo.phone && <p>{customerInfo.phone}</p>}
						</div>
					</div>

					{/* Payment Summary */}
					<div>
						<h3 className="mb-2 font-semibold">Payment Method</h3>
						<div className="flex items-center gap-2 rounded bg-blue-50 p-3 text-sm dark:bg-blue-950/20">
							<div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
								<span className="font-bold text-xs">$</span>
							</div>
							<span className="font-medium">Cash on Delivery</span>
						</div>
					</div>

					{/* Order Items */}
					<div>
						<h3 className="mb-2 font-semibold">Order Items</h3>
						<div className="space-y-3">
							{items.map((item) => (
								<div
									key={item.id}
									className="flex items-center justify-between border-b py-2"
								>
									<div className="flex items-center gap-3">
										{item.image && (
											<img
												src={item.image}
												alt={item.name}
												className="h-12 w-12 rounded object-cover"
											/>
										)}
										<div>
											<p className="font-medium">{item.name}</p>
											<p className="text-muted-foreground text-sm">
												Qty: {item.quantity}
											</p>
										</div>
									</div>
									<p className="font-medium">
										${(item.price * item.quantity).toFixed(2)}
									</p>
								</div>
							))}
						</div>
					</div>

					{/* Order Summary */}
					<div className="border-t pt-4">
						<div className="flex items-center justify-between font-bold text-lg">
							<span>Total</span>
							<span>${total().toFixed(2)}</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Trust badges and security notice */}
			<div className="rounded-lg bg-muted p-4">
				<div className="flex items-center justify-center gap-6 text-muted-foreground text-sm">
					<div className="flex items-center gap-1">
						<Shield className="h-4 w-4 text-green-500" />
						<span>Secure SSL Encryption</span>
					</div>
					<div className="flex items-center gap-1">
						<Check className="h-4 w-4 text-green-500" />
						<span>30-Day Returns</span>
					</div>
					<div className="flex items-center gap-1">
						<Truck className="h-4 w-4 text-blue-500" />
						<span>Free Shipping</span>
					</div>
				</div>
			</div>
		</div>
	);

	const renderNavigationButtons = () => (
		<div className="flex gap-4 pt-6">
			{currentStep !== "shipping" && (
				<Button
					type="button"
					variant="outline"
					onClick={prevStep}
					className="flex-1"
				>
					Back
				</Button>
			)}
			{currentStep !== "review" ? (
				<Button type="button" onClick={nextStep} className="flex-1">
					Continue to{" "}
					{steps[steps.findIndex((s) => s.id === currentStep) + 1]?.title}
				</Button>
			) : (
				<Button
					type="submit"
					className="flex-1"
					disabled={isSubmitting || items.length === 0}
				>
					{isSubmitting
						? "Processing Order..."
						: `Place Order - $${total().toFixed(2)}`}
				</Button>
			)}
		</div>
	);

	const renderSidebar = () => (
		<div className="space-y-4 lg:w-80">
			<Card>
				<CardHeader>
					<CardTitle>Order Summary</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{items.map((item) => (
							<div key={item.id} className="flex gap-3">
								{item.image && (
									<img
										src={item.image}
										alt={item.name}
										className="h-12 w-12 rounded object-cover"
									/>
								)}
								<div className="flex-1">
									<p className="font-medium text-sm">{item.name}</p>
									<p className="text-muted-foreground text-xs">
										Qty: {item.quantity}
									</p>
								</div>
								<p className="font-medium text-sm">
									${(item.price * item.quantity).toFixed(2)}
								</p>
							</div>
						))}
					</div>
					<Separator className="my-4" />
					<div className="space-y-2">
						<div className="flex justify-between text-sm">
							<span>Subtotal</span>
							<span>${total().toFixed(2)}</span>
						</div>
						<div className="flex justify-between text-sm">
							<span>Shipping</span>
							<span className="text-green-600">Free</span>
						</div>
						<div className="flex justify-between text-sm">
							<span>Tax</span>
							<span>$0.00</span>
						</div>
						<Separator />
						<div className="flex justify-between font-bold">
							<span>Total</span>
							<span>${total().toFixed(2)}</span>
						</div>
					</div>
					{/* Coupon code section */}
					<div className="mt-4 space-y-2">
						<Label htmlFor="coupon" className="text-sm">
							Coupon Code
						</Label>
						<div className="flex gap-2">
							<Input
								id="coupon"
								placeholder="Enter code"
								value={couponCode}
								onChange={(e) => setCouponCode(e.target.value)}
								className="text-sm"
							/>
							<Button variant="outline" size="sm">
								Apply
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Trust signals */}
			<div className="space-y-3">
				<div className="flex items-center gap-2 text-muted-foreground text-sm">
					<Shield className="h-4 w-4 text-green-500" />
					<span>Secure Checkout • SSL Protected</span>
				</div>
				<div className="flex items-center gap-2 text-muted-foreground text-sm">
					<Check className="h-4 w-4 text-green-500" />
					<span>30-Day Money Back Guarantee</span>
				</div>
			</div>
		</div>
	);

	return (
		<div className="mx-auto max-w-6xl">
			<div className="grid gap-8 lg:grid-cols-[1fr_320px]">
				{/* Main checkout form */}
				<div>
					{renderProgressBar()}

					<form onSubmit={handleSubmit} className="space-y-6">
						{currentStep === "shipping" && renderShippingStep()}
						{currentStep === "payment" && renderPaymentStep()}
						{currentStep === "review" && renderReviewStep()}

						{renderNavigationButtons()}
					</form>
				</div>

				{/* Sidebar */}
				{renderSidebar()}
			</div>
		</div>
	);
}
