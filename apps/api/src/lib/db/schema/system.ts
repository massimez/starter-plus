import {
	boolean,
	integer,
	jsonb,
	numeric,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { softAudit } from "./helpers/common";
import type { TImage } from "./helpers/types";

export const language = pgTable("language", {
	id: serial("id").primaryKey(),
	code: varchar("code", { length: 5 }).notNull().unique(),
	name: varchar("name", { length: 100 }).notNull(),
	nativeName: varchar("native_name", { length: 20 }),
	isActive: boolean("is_active").notNull().default(true),
	isDefault: boolean("is_default").notNull().default(false),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const currency = pgTable("currency", {
	id: serial("id").primaryKey(),
	code: varchar("code", { length: 3 }).notNull().unique(),
	name: varchar("name", { length: 100 }).notNull(),
	symbol: varchar("symbol", { length: 10 }),
	isActive: boolean("is_active").notNull().default(true),
	isDefault: boolean("is_default").notNull().default(false),
	exchangeRate: numeric("exchange_rate").notNull().default("1.0"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const businesses = pgTable("businesses", {
	id: serial("id").primaryKey(),
	parentId: integer("parent_id"),
	code: text("code").notNull().unique(),
	name: text("name").notNull(),
	keywords: text("keywords"),
	order: integer("order"),
	images: jsonb("images").$type<TImage[]>(),
	featured: boolean("featured").notNull().default(true),
	isActive: boolean("is_active").notNull().default(true),
	hasOnlineServices: boolean("has_online_services"),
	hasSubCategory: boolean("has_sub_category"),
	suggestedServices: text("suggested_services"),
	...softAudit,
});
