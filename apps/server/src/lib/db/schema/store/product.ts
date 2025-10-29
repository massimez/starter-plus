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
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { softAudit } from "../helpers/common";
import type { TImage, TProductStatus, TVideo } from "../helpers/types";
import { organization } from "../organization";
import { user } from "../user";
import { order } from "./order";
import { brand } from "./supplier";

/**
 * ---------------------------------------------------------------------------
 * PRODUCT COLLECTIONS + TRANSLATIONS
 * ---------------------------------------------------------------------------
 */
export const productCollection = pgTable("product_collection", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	parentId: uuid("parent_id").references((): PgColumn => productCollection.id, {
		onDelete: "set null",
	}),
	name: varchar("name", { length: 255 }).notNull(),
	slug: varchar("slug", { length: 255 }).notNull(),
	description: text("description"),
	image: text("image"),
	sortOrder: integer("sort_order").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	translations:
		jsonb("translations").$type<
			{
				languageCode: string;
				name: string;
				slug: string;
				description?: string;
				metaTitle?: string;
				metaDescription?: string;
			}[]
		>(),
	...softAudit,
});

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
	name: varchar("name", { length: 255 }),
	status: text("status").default("draft").notNull().$type<TProductStatus>(),
	type: varchar("type", { length: 50 }).default("simple").notNull(), // simple, variable, digital
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

	images: jsonb("images").$type<TImage[]>(),
	thumbnailImage: jsonb("thumbnail_image").$type<TImage>(),

	// Translations
	translations:
		jsonb("translations").$type<
			{
				languageCode: string;
				name: string;
				slug: string;
				shortDescription?: string;
				description?: string;
				brandName?: string;
				seoTitle?: string;
				seoDescription?: string;
				tags?: string;
				specifications?: Record<string, any>;
			}[]
		>(),

	...softAudit,
});

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

	// Stock management
	reorderPoint: integer("reorder_point").default(10).notNull(),
	maxStock: integer("max_stock"),
	reorderQuantity: integer("reorder_quantity").default(50).notNull(),

	price: numeric("price", { precision: 12, scale: 2 }).notNull(),
	compareAtPrice: numeric("compare_at_price", { precision: 12, scale: 2 }),
	cost: numeric("cost", { precision: 12, scale: 2 }),
	unit: varchar("unit", { length: 255 }),
	isActive: boolean("is_active").default(true).notNull(),
	translations:
		jsonb("translations").$type<
			{
				languageCode: string;
				name?: string; // e.g. "Red / L"
				attributes?: Record<string, string>;
			}[]
		>(),
	...softAudit,
});

export const productVariantOption = pgTable("product_variant_option", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	productId: uuid("product_id")
		.notNull()
		.references(() => product.id, { onDelete: "cascade" }),
	name: varchar("name", { length: 100 }).notNull(), // "Size", "Color", "Material", "Finish"
	displayName: jsonb("display_name").$type<Record<string, string>>(), // { "en": "Size", "fr": "Taille" }
	position: integer("position").default(0).notNull(), // Display order
	isRequired: boolean("is_required").default(true).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	...softAudit,
});

/**
 * ---------------------------------------------------------------------------
 * PRODUCT-COLLECTION ASSIGNMENTS & SUPPLIERS
 * ---------------------------------------------------------------------------
 */
// TODO CRUD API
export const productCollectionAssignment = pgTable(
	"product_collection_assignment",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		productId: uuid("product_id")
			.notNull()
			.references(() => product.id, { onDelete: "cascade" }),
		collectionId: uuid("collection_id")
			.notNull()
			.references(() => productCollection.id, { onDelete: "cascade" }),
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
