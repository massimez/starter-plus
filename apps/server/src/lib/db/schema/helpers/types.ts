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

export type TImage = {
	url: string;
	alt?: string;
	type?: string;
	itemType?: string;
	key?: string;
	name?: string;
	size?: number;
};

export type TVideo = {
	key?: string;
	url: string;
	alt?: string;
	type?: string;
	size?: number;
	itemType?: string;
};

export type TSocialLinks = {
	facebook?: string;
	instagram?: string;
	twitter?: string; // or "x"?
	linkedin?: string;
	tiktok?: string;
	youtube?: string;
	telegram?: string;
	website?: string;
};

export type TPaymentStatus =
	| "pending"
	| "processing"
	| "paid"
	| "partially_paid"
	| "failed"
	| "refunded"
	| "cancelled";

export type TOrderStatus =
	| "pending" // Just created, awaiting payment
	| "paid" // Payment confirmed
	| "processing" // Being prepared for shipment
	| "shipped" // On its way to customer
	| "delivered" // Successfully delivered
	| "cancelled" // Cancelled before shipping
	| "refunded" // Money returned to customer
	| "returned" // Items returned by customer
	| "exchanged" // Items exchanged
	| "on_hold" // Temporarily paused
	| "failed" // Payment or fulfillment failed
	| "partially_shipped" // Some items shipped
	| "partially_delivered" // Some items delivered
	| "awaiting_pickup"; // Ready for customer pickup

export type TProductStatus = "draft" | "active" | "archived" | "out_of_stock";

export type TStockMovementType =
	| "purchase" // Inventory received from supplier
	| "sale" // Sold to customer
	| "adjustment" // Manual stock correction
	| "return" // Customer return (adds back)
	| "return_to_supplier" // Return to supplier (removes)
	| "damaged" // Damaged goods writeoff
	| "expired" // Expired goods writeoff
	| "theft" // Shrinkage/theft
	| "transfer_in" // Transfer from another location
	| "transfer_out" // Transfer to another location
	| "assembly" // Used in product assembly
	| "disassembly" // From product disassembly
	| "promotion" // Promotional giveaway
	| "sample" // Product samples
	| "manufacturing" // Used in manufacturing
	| "cycle_count" // Cycle count adjustment
	| "lost" // Lost inventory
	| "found" // Found inventory
	| "reservation" // Reserved for order
	| "unreservation"; // Released reservation

export type TBonusTransactionType =
	| "earned_purchase"
	| "earned_signup"
	| "earned_referral"
	| "earned_manual"
	| "redeemed_discount"
	| "redeemed_product"
	| "redeemed_cash"
	| "expired";

export type TRewardType =
	| "percentage_discount"
	| "fixed_discount"
	| "free_shipping"
	| "free_product"
	| "cash_back";

export type TCouponStatus = "active" | "used" | "expired" | "cancelled";
