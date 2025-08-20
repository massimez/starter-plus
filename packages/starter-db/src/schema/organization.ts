import {
	boolean,
	integer,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./user";

export const organization = pgTable("organization", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	slug: text("slug").unique(),
	logo: text("logo"),
	defaultLanguageId: integer("default_language_id")
		.references(() => languages.id)
		.notNull(),
	activeLanguages: text("name")
		.notNull()
		.$defaultFn(() => "en"),
	createdAt: timestamp("created_at").notNull(),
	metadata: text("metadata"),
});

export const member = pgTable("member", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	role: text("role").default("member").notNull(),
	createdAt: timestamp("created_at").notNull(),
});

export const invitation = pgTable("invitation", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	email: text("email").notNull(),
	role: text("role"),
	status: text("status").default("pending").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	inviterId: text("inviter_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const languages = pgTable("languages", {
	id: text("id").primaryKey(),
	code: text("code").notNull().unique(),
	name: text("name").notNull(),
	nativeName: text("native_name"),
	isActive: boolean("is_active").notNull().default(true),
	isDefault: boolean("is_default").notNull().default(false),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
