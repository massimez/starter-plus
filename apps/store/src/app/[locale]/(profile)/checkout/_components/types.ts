export type CheckoutStep = "shipping" | "payment" | "review";

export interface CheckoutFormProps {
	organizationId: string;
	locationId: string;
	currency?: string;
}

export interface Address {
	street: string;
	city: string;
	state: string;
	country: string;
	postalCode: string;
}

export interface CustomerInfo {
	fullName: string;
	email: string;
	phone: string;
}

export interface CheckoutFormData {
	shippingAddress: Address;
	billingAddress: Partial<Address>;
	customerInfo: CustomerInfo;
	useDifferentBilling: boolean;
}

export interface StepConfig {
	id: CheckoutStep;
	title: string;
	icon: React.ComponentType<{ className?: string }>;
}
