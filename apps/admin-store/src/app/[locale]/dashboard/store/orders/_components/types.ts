export type ORDER_STATUS =
	| "draft" // Created but not confirmed or paid yet
	| "pending" // Awaiting payment or confirmation
	| "confirmed" // Payment confirmed or manually approved
	| "processing" // Being prepared / packaged / awaiting shipment
	| "shipped" // Out for delivery
	| "delivered" // Customer received the items
	| "completed" // Closed successfully, after post-delivery checks
	| "cancelled" // Cancelled before or during processing
	| "failed" // Payment or processing failed
	| "returned" // Returned by customer
	| "paid" // Payment received and order is confirmed
	| "refunded"; // Fully refunded to customer

export type PAYMENT_STATUS =
	| "pending" // Waiting for payment (default)
	| "authorized" // Payment authorized but not yet captured
	| "paid" // Payment fully completed
	| "partially_refunded" // Part of the payment refunded
	| "refunded" // Fully refunded
	| "failed" // Payment failed or was declined
	| "cancelled"; // Cancelled before capture

export type TAddress = {
	building?: string;
	office?: string;
	street?: string;
	city?: string;
	state?: string;
	country?: string;
	zipCode?: string;
	address?: string;
};
export interface OrderItem {
	id: string;
	organizationId: string;
	orderId: string;
	productVariantId: string;
	locationId: string;
	productName: string;
	variantName?: string;
	sku: string;
	quantity: number;
	unitPrice: string;
	unitCost?: string;
	totalPrice: string;
	quantityShipped: number;
	quantityReturned: number;
	createdAt: string;
	updatedAt: string;
	deletedAt?: string;
}

export interface Order {
	id: string;
	organizationId: string;
	userId?: string;
	orderNumber: string;
	status: ORDER_STATUS;
	currency: string;
	subtotal: string;
	taxAmount: string;
	shippingAmount: string;
	discountAmount: string;
	totalAmount: string;
	customerFullName?: string;
	customerEmail?: string;
	customerPhone?: string;
	customerNotes?: string;
	shippingAddress: TAddress;
	billingAddress?: TAddress;
	paymentMethod?: string;
	paymentStatus?: PAYMENT_STATUS;
	shippingMethod?: string;
	trackingNumber?: string;
	orderDate: string;
	expectedShipDate?: string;
	shippedAt?: string;
	deliveredAt?: string;
	cancelledAt?: string;
	locationId: string;
	notes?: string;
	tags?: string[];
	// biome-ignore lint/suspicious/noExplicitAny: <>
	metadata?: Record<string, any>;
	createdAt: string;
	updatedAt: string;
	deletedAt?: string;
	items?: OrderItem[];
}
