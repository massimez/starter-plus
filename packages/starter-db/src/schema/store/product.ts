import { sql } from "drizzle-orm";
import {
	boolean,
	integer,
	jsonb,
	numeric,
	type PgColumn,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { softAudit } from "../helpers/common";
import type { TImage, TProductStatus, TVideo } from "../helpers/types";
import { organization } from "../organization";
import { language } from "../system";
import { user } from "../user";
import { order } from "./order";
import { brand } from "./supplier";

/**
 * ---------------------------------------------------------------------------
 * PRODUCT CATEGORIES + TRANSLATIONS
 * ---------------------------------------------------------------------------
 */
export const productCategory = pgTable("product_category", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	parentId: uuid("parent_id").references((): PgColumn => productCategory.id, {
		onDelete: "set null",
	}),
	name: varchar("name", { length: 255 }).notNull(),
	slug: varchar("slug", { length: 255 }).notNull(),
	description: text("description"),
	image: text("image"),
	sortOrder: integer("sort_order").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	...softAudit,
});

export const productCategoryTranslation = pgTable(
	"product_category_translation",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		categoryId: uuid("category_id")
			.notNull()
			.references(() => productCategory.id, { onDelete: "cascade" }),
		languageCode: text("language_code")
			.notNull()
			.references(() => language.code, { onDelete: "cascade" }),

		name: varchar("name", { length: 255 }).notNull(),
		slug: varchar("slug", { length: 255 }).notNull(),
		description: text("description"),
		metaTitle: varchar("meta_title", { length: 255 }),
		metaDescription: text("meta_description"),
		...softAudit,
	},
	(table) => [
		uniqueIndex("product_category_language_idx").on(
			table.organizationId,
			table.categoryId,
			table.languageCode,
		),
	],
);

/**
 * ---------------------------------------------------------------------------
 * PRODUCTS & TRANSLATIONS
 * ---------------------------------------------------------------------------
 */
export const product = pgTable("product", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	brandId: uuid("brand_id").references(() => brand.id, {
		onDelete: "set null",
	}),
	status: text("status").default("draft").notNull().$type<TProductStatus>(),
	type: varchar("type", { length: 50 }).default("simple").notNull(), // simple, variable, digital
	currency: varchar("currency", { length: 3 }).notNull(),
	taxRate: numeric("tax_rate", { precision: 5, scale: 2 })
		.default("0.00")
		.notNull(),

	// Bulk pricing
	minQuantity: integer("min_quantity").default(1).notNull(),
	maxQuantity: integer("max_quantity"),
	isFeatured: boolean("is_featured").default(false).notNull(),
	trackStock: boolean("track_stock").default(true).notNull(),
	allowBackorders: boolean("allow_backorders").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	metadata: jsonb("metadata"),

	...softAudit,
});

export const productTranslation = pgTable(
	"product_translation",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		productId: uuid("product_id")
			.notNull()
			.references(() => product.id, { onDelete: "cascade" }),
		languageCode: text("language_code")
			.notNull()
			.references(() => language.code, { onDelete: "cascade" }),

		name: varchar("name", { length: 255 }).notNull(),
		slug: varchar("slug", { length: 255 }).notNull(),
		shortDescription: text("short_description"),
		description: text("description"),

		brandName: varchar("brand_name", { length: 100 }),
		images: jsonb("images").$type<TImage[]>(), // [{url, alt}]
		seoTitle: varchar("seo_title", { length: 255 }),
		seoDescription: text("seo_description"),
		tags: text("tags"),

		...softAudit,
	},
	(table) => [
		uniqueIndex("product_language_idx").on(
			table.organizationId,
			table.productId,
			table.languageCode,
		),
	],
);

/**
 * ---------------------------------------------------------------------------
 * VARIANTS, ATTRIBUTES, PRICES & STOCK
 * ---------------------------------------------------------------------------
 */
export const productVariant = pgTable("product_variant", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),

	productId: uuid("product_id")
		.notNull()
		.references(() => product.id, { onDelete: "cascade" }),

	sku: varchar("sku", { length: 100 }).notNull(),
	barcode: varchar("barcode", { length: 64 }), // optional UPC/EAN
	barcodeType: varchar("barcode_type", { length: 50 }),

	// Physical props
	weightKg: numeric("weight_kg", { precision: 8, scale: 3 }),
	dimensionsCm: jsonb("dimensions_cm"), // {length, width, height}

	// Free-form details (localized via translations if needed)
	features: jsonb("features"), // ["feature 1", "feature 2"]
	specifications: jsonb("specifications"),

	// Stock management
	reorderPoint: integer("reorder_point").default(10).notNull(),
	maxStock: integer("max_stock"),
	reorderQuantity: integer("reorder_quantity").default(50).notNull(),

	price: numeric("price", { precision: 12, scale: 2 }).notNull(),
	compareAtPrice: numeric("compare_at_price", { precision: 12, scale: 2 }),
	cost: numeric("cost", { precision: 12, scale: 2 }),
	unit: varchar("unit", { length: 255 }),
	isActive: boolean("is_active").default(true).notNull(),
	...softAudit,
});
export const productVariantTranslation = pgTable(
	"product_variant_translation",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		productVariantId: uuid("product_variant_id")
			.notNull()
			.references(() => productVariant.id, { onDelete: "cascade" }),
		languageCode: text("language_code")
			.notNull()
			.references(() => language.code, { onDelete: "cascade" }),

		name: varchar("name", { length: 255 }), // e.g. "Red / L"
		attributes: jsonb("attributes"), // optional localized attrs
		features: jsonb("features"),
		specifications: jsonb("specifications"),
		...softAudit,
	},
	(table) => [
		uniqueIndex("product_variant_language_idx").on(
			table.organizationId,
			table.productVariantId,
			table.languageCode,
		),
	],
);

// Structured attributes for filtering/indexing
export const productVariantAttribute = pgTable("product_variant_attribute", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	productVariantId: uuid("product_variant_id")
		.notNull()
		.references(() => productVariant.id, { onDelete: "cascade" }),

	attributeName: varchar("attribute_name", { length: 100 }).notNull(),
	attributeValue: varchar("attribute_value", { length: 255 }).notNull(),
	sortOrder: integer("sort_order").default(0),
	isActive: boolean("is_active").default(true).notNull(),
	...softAudit,
});

/**
 * ---------------------------------------------------------------------------
 * PRODUCT-CATEGORY ASSIGNMENTS & SUPPLIERS
 * ---------------------------------------------------------------------------
 */
// TODO CRUD API
export const productCategoryAssignment = pgTable(
	"product_category_assignment",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		productId: uuid("product_id")
			.notNull()
			.references(() => product.id, { onDelete: "cascade" }),
		categoryId: uuid("category_id")
			.notNull()
			.references(() => productCategory.id, { onDelete: "cascade" }),
		...softAudit,
	},
);

export const productReview = pgTable("product_review", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	productId: uuid("product_id")
		.notNull()
		.references(() => product.id, { onDelete: "cascade" }),
	productVariantId: uuid("product_variant_id").references(
		() => productVariant.id,
		{ onDelete: "set null" },
	),
	userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
	orderId: uuid("order_id").references(() => order.id, {
		onDelete: "set null",
	}),
	isAnonymous: boolean("is_anonymous").default(false),
	rating: integer("rating").notNull(), // 1-5
	title: varchar("title", { length: 255 }),
	content: text("content"),
	pros: text("pros"),
	cons: text("cons"),

	// Media attachments
	images: jsonb("images").$type<TImage[]>(),
	videos: jsonb("videos").$type<TVideo[]>(),

	// Verification & moderation
	isVerifiedPurchase: boolean("is_verified_purchase").default(false),
	isPublished: boolean("is_published").default(true),
	moderationStatus: varchar("moderation_status", { length: 50 }).default(
		"pending",
	),
	moderatedBy: text("moderated_by").references(() => user.id),
	moderatedAt: timestamp("moderated_at"),

	// Engagement
	helpfulCount: integer("helpful_count").default(0),
	unhelpfulCount: integer("unhelpful_count").default(0),

	// Customer info snapshot
	customerName: varchar("customer_name", { length: 255 }),
	customerVerified: boolean("customer_verified").default(false),
	...softAudit,
});
