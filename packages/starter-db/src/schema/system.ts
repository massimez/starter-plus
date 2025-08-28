import {
	boolean,
	integer,
	jsonb,
	numeric,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import type { TImage } from "./helpers/types";

export const language = pgTable("language", {
	id: serial("id").primaryKey(),
	code: text("code").notNull().unique(),
	name: text("name").notNull(),
	nativeName: text("native_name"),
	isActive: boolean("is_active").notNull().default(true),
	isDefault: boolean("is_default").notNull().default(false),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const currency = pgTable("currency", {
	id: serial("id").primaryKey(),
	code: text("code").notNull().unique(),
	name: text("name").notNull(),
	symbol: text("symbol"),
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
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
