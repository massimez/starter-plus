import { z } from "zod";

// Main checkout form validation schema
export const checkoutSchema = z.object({
	shippingAddress: z.object({
		street: z.string(),
		city: z.string(),
		state: z.string(),
		country: z.string(),
		postalCode: z.string(),
	}),
	billingAddress: z.object({
		street: z.string().optional(),
		city: z.string().optional(),
		state: z.string().optional(),
		country: z.string().optional(),
		postalCode: z.string().optional(),
	}),
	customerInfo: z.object({
		fullName: z.string(),
		email: z.string().email("Invalid email address"),
		phone: z.string(),
	}),
	useDifferentBilling: z.boolean().default(false),
});

// Step-specific validation schemas
export const shippingAddressSchema = z.object({
	street: z.string().min(1, "Street address is required"),
	city: z.string().min(1, "City is required"),
	state: z.string().min(1, "State/Province is required"),
	country: z.string().min(1, "Country is required"),
	postalCode: z.string().min(1, "Postal code is required"),
});

export const customerInfoSchema = z.object({
	fullName: z.string().min(1, "Full name is required"),
	email: z.string().email("Invalid email address"),
	phone: z.string().min(1, "Phone number is required"),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
