import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { idAndAuditFields } from "@/helpers/constant/fields";
import {
	shippingMethod,
	shippingMethodZone,
	shippingZone,
} from "@/lib/db/schema";

// Shipping Method schemas
export const insertShippingMethodSchema = createInsertSchema(shippingMethod, {
	basePrice: (s) => z.preprocess((v: unknown) => (v === "" ? "0" : v), s),
	minOrderAmount: (s) => z.preprocess((v: unknown) => (v === "" ? null : v), s),
	maxOrderAmount: (s) => z.preprocess((v: unknown) => (v === "" ? null : v), s),
	freeShippingThreshold: (s) =>
		z.preprocess((v: unknown) => (v === "" ? null : v), s),
}).omit({
	organizationId: true,
});
export const updateShippingMethodSchema = createInsertSchema(shippingMethod, {
	basePrice: (s) => z.preprocess((v: unknown) => (v === "" ? "0" : v), s),
	minOrderAmount: (s) => z.preprocess((v: unknown) => (v === "" ? null : v), s),
	maxOrderAmount: (s) => z.preprocess((v: unknown) => (v === "" ? null : v), s),
	freeShippingThreshold: (s) =>
		z.preprocess((v: unknown) => (v === "" ? null : v), s),
})
	.omit(idAndAuditFields)
	.partial();

// Shipping Zone schemas
export const insertShippingZoneSchema = createInsertSchema(shippingZone);
export const updateShippingZoneSchema = createSelectSchema(shippingZone)
	.omit(idAndAuditFields)
	.partial();

// Shipping Method Zone schemas
export const insertShippingMethodZoneSchema = createInsertSchema(
	shippingMethodZone,
	{
		priceOverride: (s) =>
			z.preprocess((v: unknown) => (v === "" ? null : v), s),
	},
).omit({ organizationId: true });
export const updateShippingMethodZoneSchema = createSelectSchema(
	shippingMethodZone,
	{
		priceOverride: (s) =>
			z.preprocess((v: unknown) => (v === "" ? null : v), s),
	},
)
	.omit(idAndAuditFields)
	.partial();
