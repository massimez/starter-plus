import { z } from "zod";

export const offsetPaginationSchema = z.object({
	limit: z.coerce.number().min(1).default(20),
	offset: z.coerce.number().min(0).default(0),
	orderBy: z.string().max(100).optional(),
	direction: z.enum(["asc", "desc"]).default("asc").optional(),
});

export const orderPaginationSchema = offsetPaginationSchema.extend({
	status: z.string().optional(),
	userId: z.string().optional(),
	search: z.string().optional(),
});

export const languageCodeSchema = z.object({
	languageCode: z.string().max(2).optional(),
});
