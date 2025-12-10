import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { idAndAuditFields } from "@/helpers/constant/fields";
import {
	shippingMethod,
	shippingMethodZone,
	shippingZone,
} from "@/lib/db/schema";

// Shipping Method schemas
export const insertShippingMethodSchema = createInsertSchema(shippingMethod, {
	minOrderAmount: (schema) =>
		schema.transform((val: unknown) => (val === "" ? null : val)),
	maxOrderAmount: (schema) =>
		schema.transform((val: unknown) => (val === "" ? null : val)),
	freeShippingThreshold: (schema) =>
		schema.transform((val: unknown) => (val === "" ? null : val)),
}).omit({
	organizationId: true,
});
export const updateShippingMethodSchema = createInsertSchema(shippingMethod, {
	minOrderAmount: (schema) =>
		schema.transform((val: unknown) => (val === "" ? null : val)),
	maxOrderAmount: (schema) =>
		schema.transform((val: unknown) => (val === "" ? null : val)),
	freeShippingThreshold: (schema) =>
		schema.transform((val: unknown) => (val === "" ? null : val)),
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
).omit({ organizationId: true });
export const updateShippingMethodZoneSchema = createSelectSchema(
	shippingMethodZone,
)
	.omit(idAndAuditFields)
	.partial();
