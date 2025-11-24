import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { idAndAuditFields } from "@/helpers/constant/fields";
import {
	shippingMethod,
	shippingMethodZone,
	shippingZone,
} from "@/lib/db/schema";

// Shipping Method schemas
export const insertShippingMethodSchema = createInsertSchema(shippingMethod);
export const updateShippingMethodSchema = createSelectSchema(shippingMethod)
	.omit(idAndAuditFields)
	.partial();

// Shipping Zone schemas
export const insertShippingZoneSchema = createInsertSchema(shippingZone);
export const updateShippingZoneSchema = createSelectSchema(shippingZone)
	.omit(idAndAuditFields)
	.partial();

// Shipping Method Zone schemas
export const insertShippingMethodZoneSchema =
	createInsertSchema(shippingMethodZone);
export const updateShippingMethodZoneSchema = createSelectSchema(
	shippingMethodZone,
)
	.omit(idAndAuditFields)
	.partial();
