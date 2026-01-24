import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { idAndAuditFields } from "@/helpers/constant/fields";
import { supplier } from "@/lib/db/schema";

export const insertSupplierSchema = createInsertSchema(supplier);
export const updateSupplierSchema = createSelectSchema(supplier)
	.omit(idAndAuditFields)
	.partial();
