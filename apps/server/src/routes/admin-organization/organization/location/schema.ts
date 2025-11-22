import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { idAndAuditFields } from "@/helpers/constant/fields";
import { location } from "@/lib/db/schema";

const addressSchema = z.object({
	street: z.string().max(255).optional(),
	city: z.string().max(100).optional(),
	state: z.string().max(100).optional(),
	zipCode: z.string().max(20).optional(),
	country: z.string().max(100).optional(),
	office: z.string().max(255).optional(),
	building: z.string().max(255).optional(),
	latitude: z.string().max(20).optional(),
	longitude: z.string().max(20).optional(),
});

export const insertLocationSchema = createInsertSchema(location)
	.omit(idAndAuditFields)
	.extend({
		locationType: z.enum(["warehouse", "shop", "distribution_center"]),
		name: z.string().min(1).max(255),
		organizationId: z.string().min(1).max(255),
		description: z.string().optional(),
		address: addressSchema.optional(),
		capacity: z.number().int().positive().optional(),
		contactName: z.string().max(100).optional(),
		contactEmail: z.string().email().max(100).optional(),
		contactPhone: z.string().max(20).optional(),
		isActive: z.boolean().default(true).optional(),
		isDefault: z.boolean().default(false).optional(),
		metadata: z.record(z.string(), z.unknown()).optional(),
	});

export type InsertLocation = z.infer<typeof insertLocationSchema>;

export const updateLocationSchema = createSelectSchema(location)
	.omit(idAndAuditFields)
	.partial()
	.extend({
		locationType: z
			.enum(["warehouse", "shop", "distribution_center"])
			.optional(),
		name: z.string().min(1).max(255).optional(),
		description: z.string().optional(),
		address: addressSchema.optional(),
		capacity: z.number().int().positive().optional(),
		contactName: z.string().max(100).optional(),
		contactEmail: z.string().email().max(100).optional(),
		contactPhone: z.string().max(20).optional(),
		isActive: z.boolean().optional(),
		isDefault: z.boolean().optional(),
		metadata: z.record(z.string(), z.unknown()).optional(),
	});
