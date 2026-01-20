"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Form } from "@workspace/ui/components/form";
import { AlertCircle, Check, CreditCard, Truck, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { type Path, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useProfile } from "@/lib/hooks/use-profile";
import { StorefrontError, storefrontClient } from "@/lib/storefront";
import { useCartStore } from "@/store/use-cart-store";
import { NavigationButtons } from "./navigation-buttons";
import { OrderStatusSheet } from "./order-status-sheet";
import { PaymentStep } from "./payment-step";
import { ReviewStep } from "./review-step";
import { ShippingStep } from "./shipping-step";
import type { CheckoutFormProps, CheckoutStep, StepConfig } from "./types";
import {
	type CheckoutFormValues,
	checkoutSchema,
	customerInfoSchema,
	shippingAddressSchema,
} from "./validation";

export function CheckoutForm({
	locationId,
	currency = "USD",
	onClose,
	onBack,
}: CheckoutFormProps) {
	const t = useTranslations("Checkout");
	const { items, total, appliedCoupon, clearCart } = useCartStore();
	const { data: session } = useSession();
	const { profile, updateProfile, loading: profileLoading } = useProfile();
	const [currentStep, setCurrentStep] = useState<CheckoutStep>("shipping");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [apiErrors, setApiErrors] = useState<Record<string, string>>({});
	const [saveAddress, setSaveAddress] = useState(true);
	const [selectedAddressIndex, setSelectedAddressIndex] = useState<
		string | undefined
	>(undefined);

	/* State for order success sheet */
	const [successOrder, setSuccessOrder] = useState<{
		id: string;
		orderNumber: string;
	} | null>(null);
	const [showSuccessSheet, setShowSuccessSheet] = useState(false);
	const form = useForm<CheckoutFormValues>({
		resolver: zodResolver(checkoutSchema),
		defaultValues: {
			shippingAddress: {
				street: "",
				city: "",
				state: "",
				country: "",
				postalCode: "",
			},
			billingAddress: {
				street: "",
				city: "",
				state: "",
				country: "",
				postalCode: "",
			},
			customerInfo: {
				fullName: session?.user?.name || "",
				email: session?.user?.email || "",
				phone: "",
			},
			useDifferentBilling: false,
		},
	});

	const steps: StepConfig[] = [
		{ id: "shipping", title: t("steps.shipping"), icon: Truck },
		{ id: "payment", title: t("steps.payment"), icon: CreditCard },
		{ id: "review", title: t("steps.review"), icon: Check },
	];

	const nextStep = async () => {
		// Validate current step fields using step-specific schemas
		if (currentStep === "shipping") {
			const shippingAddressValues = form.getValues("shippingAddress");
			const validationResult = shippingAddressSchema.safeParse(
				shippingAddressValues,
			);

			if (validationResult.success) {
				setCurrentStep("payment");
			} else {
				// Set field errors for display
				validationResult.error.issues.forEach((issue) => {
					const fieldPath = `shippingAddress.${String(issue.path[0])}`;
					form.setError(fieldPath as Path<CheckoutFormValues>, {
						type: "manual",
						message: issue.message,
					});
				});
			}
		} else if (currentStep === "payment") {
			const customerInfoValues = form.getValues("customerInfo");
			const validationResult = customerInfoSchema.safeParse(customerInfoValues);

			if (validationResult.success) {
				setCurrentStep("review");
			} else {
				// Set field errors for display
				validationResult.error.issues.forEach((issue) => {
					const fieldPath = `customerInfo.${String(issue.path[0])}`;
					form.setError(fieldPath as Path<CheckoutFormValues>, {
						type: "manual",
						message: issue.message,
					});
				});
			}
		}
	};

	const prevStep = () => {
		if (currentStep === "payment") setCurrentStep("shipping");
		else if (currentStep === "review") setCurrentStep("payment");
	};

	// Handle address selection from saved addresses
	const handleAddressSelect = useCallback(
		(addressIndex: string | undefined) => {
			setSelectedAddressIndex(addressIndex);

			if (addressIndex === "new") {
				setSaveAddress(true);
				form.setValue("shippingAddress.street", "");
				form.setValue("shippingAddress.city", "");
				form.setValue("shippingAddress.state", "");
				form.setValue("shippingAddress.postalCode", "");
				form.setValue("shippingAddress.country", "");
				form.setValue("shippingAddress.lat", undefined);
				form.setValue("shippingAddress.lng", undefined);
				return;
			}

			setSaveAddress(false);

			if (addressIndex && profile?.addresses) {
				const index = Number.parseInt(addressIndex, 10);
				const selectedAddress = profile.addresses[index];

				if (selectedAddress) {
					// Auto-fill the shipping address fields
					form.setValue("shippingAddress.street", selectedAddress.street || "");
					form.setValue("shippingAddress.city", selectedAddress.city || "");
					form.setValue("shippingAddress.state", selectedAddress.state || "");
					form.setValue(
						"shippingAddress.postalCode",
						selectedAddress.postalCode || "",
					);
					form.setValue(
						"shippingAddress.country",
						selectedAddress.country || "",
					);
					form.setValue("shippingAddress.lat", selectedAddress.lat);
					form.setValue("shippingAddress.lng", selectedAddress.lng);

					// Clear any validation errors for these fields
					form.clearErrors("shippingAddress");
				}
			}
		},
		[profile, form],
	);

	// Auto-select first address if available
	useEffect(() => {
		if (
			!profileLoading &&
			profile?.addresses &&
			profile.addresses.length > 0 &&
			selectedAddressIndex === undefined
		) {
			handleAddressSelect("0");
		}
	}, [profileLoading, profile, selectedAddressIndex, handleAddressSelect]);

	const onSubmit = async (data: CheckoutFormValues) => {
		// Only create order when on the review step
		if (currentStep !== "review") {
			return;
		}

		setIsSubmitting(true);
		setApiErrors({});

		try {
			// Validate that we have items
			if (items.length === 0) {
				toast.error(t("validation.emptyCart"));
				return;
			}

			// Full validation happens here
			const shippingValidation = shippingAddressSchema.safeParse(
				data.shippingAddress,
			);
			const customerValidation = customerInfoSchema.safeParse(
				data.customerInfo,
			);

			if (!shippingValidation.success || !customerValidation.success) {
				const allErrors = [];
				if (!shippingValidation.success) {
					allErrors.push(...shippingValidation.error.issues);
				}
				if (!customerValidation.success) {
					allErrors.push(...customerValidation.error.issues);
				}

				setCurrentStep("shipping");
				toast.error(t("validation.completeFields"));
				return;
			}

			// Save address if requested
			if (saveAddress && session?.user && data.shippingAddress && profile) {
				try {
					await updateProfile({
						addresses: [
							...(profile?.addresses || []),
							{
								...data.shippingAddress,
								type: "shipping",
								isDefault: false,
							},
						],
					});
					toast.success(t("validation.addressSaved"));
				} catch (error) {
					console.error("Failed to save address:", error);
					toast.error(t("validation.addressSaveFailed"));
				}
			}

			const payload = {
				locationId,
				currency,
				shippingAddress: data.shippingAddress,
				customerEmail: data.customerInfo.email,
				customerPhone: data.customerInfo.phone,
				customerFullName: data.customerInfo.fullName,
				userId: session?.user?.id || undefined,
				items: items.map((item) => ({
					productVariantId: item.productVariantId,
					quantity: item.quantity,
					locationId: item.locationId,
				})),
				...(appliedCoupon?.code ? { couponCode: appliedCoupon.code } : {}),
			};

			console.log(
				"Creating order with payload:",
				JSON.stringify(payload, null, 2),
			);

			// Create order
			const order = await storefrontClient.createOrder(payload);

			// Clear cart on success
			clearCart();

			// Set order details and show sheet
			setSuccessOrder({ id: order.id, orderNumber: order.orderNumber });
			setShowSuccessSheet(true);

			/* Removed router.push, using sheet instead */
		} catch (error) {
			console.error("Error creating order:", error);
			if (error instanceof StorefrontError && error.issues) {
				// Log detailed validation issues for debugging
				console.error(
					"Validation issues:",
					JSON.stringify(error.issues, null, 2),
				);

				// Check for stock errors first
				const hasStockError = error.issues.some(
					(issue) => issue.code === "INSUFFICIENT_STOCK",
				);

				if (hasStockError) {
					// Display stock error message directly
					const stockIssue = error.issues.find(
						(issue) => issue.code === "INSUFFICIENT_STOCK",
					);
					toast.error(stockIssue?.message || error.message);
					return;
				}

				// Handle API validation errors
				const newErrors: Record<string, string> = {};
				error.issues.forEach((issue) => {
					const key = issue.path.join(".");
					newErrors[key] = issue.message;
				});
				setApiErrors(newErrors);

				// Show detailed error message
				const errorCount = Object.keys(newErrors).length;
				toast.error(t("validation.fixErrors", { count: errorCount }), {
					description:
						Object.entries(newErrors)
							.slice(0, 3)
							.map(([field, msg]) => `${field}: ${msg}`)
							.join("\n") +
						(errorCount > 3 ? `\n...and ${errorCount - 3} more` : ""),
					duration: 5000,
				});

				// Navigate to the step with errors if needed
				const hasShippingErrors = Object.keys(newErrors).some((k) =>
					k.startsWith("shippingAddress"),
				);
				const hasBillingErrors = Object.keys(newErrors).some((k) =>
					k.startsWith("billingAddress"),
				);
				const hasCustomerErrors = Object.keys(newErrors).some((k) =>
					k.startsWith("customer"),
				);

				if (hasShippingErrors || hasBillingErrors) {
					setCurrentStep("shipping");
				} else if (hasCustomerErrors) {
					setCurrentStep("payment");
				}
			} else {
				toast.error(
					error instanceof Error ? error.message : "Failed to create order",
				);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="mx-auto flex h-full max-w-6xl flex-col">
			<div className="grid h-full gap-8">
				{/* Main checkout form */}
				<div className="flex h-full min-h-0 flex-col">
					{/* API Error Summary */}
					{Object.keys(apiErrors).length > 0 && (
						<Alert variant="destructive" className="mb-6">
							<div className="flex w-full items-start justify-between">
								<div className="flex items-start gap-2">
									<AlertCircle className="mt-0.5 h-4 w-4" />
									<div className="flex-1">
										<AlertTitle>{t("validation.title")}</AlertTitle>
										<AlertDescription className="mt-2 space-y-1">
											{Object.entries(apiErrors).map(([field, message]) => (
												<div key={field} className="text-sm">
													<strong>
														{field}
														{field && ":"}
													</strong>{" "}
													{message}
												</div>
											))}
										</AlertDescription>
									</div>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setApiErrors({})}
									className="h-6 w-6 p-0 hover:bg-transparent"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						</Alert>
					)}

					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="flex h-full min-h-0 flex-col"
						>
							<div className="flex-1 space-y-6 overflow-y-auto px-1">
								{currentStep === "shipping" && (
									<ShippingStep
										form={form}
										session={session}
										profile={profile}
										selectedAddressIndex={selectedAddressIndex}
										saveAddress={saveAddress}
										onAddressSelect={handleAddressSelect}
										onSaveAddressChange={setSaveAddress}
										isProfileLoaded={!!profile && !profileLoading}
										onBack={onBack}
									/>
								)}
								{currentStep === "payment" && <PaymentStep form={form} />}
								{currentStep === "review" && (
									<ReviewStep formValues={form.getValues()} total={total()} />
								)}
							</div>

							<div className="sticky bottom-0 z-10 mt-auto border-t bg-background p-4">
								<NavigationButtons
									currentStep={currentStep}
									steps={steps}
									isSubmitting={isSubmitting}
									itemCount={items.length}
									total={total()}
									onNext={nextStep}
									onBack={prevStep}
								/>
							</div>
						</form>
					</Form>
				</div>
				<OrderStatusSheet
					open={showSuccessSheet}
					onOpenChange={(open) => {
						setShowSuccessSheet(open);
						if (!open && successOrder && onClose) {
							onClose();
						}
					}}
					orderId={successOrder?.id || null}
					orderNumber={successOrder?.orderNumber || null}
				/>
			</div>
		</div>
	);
}
