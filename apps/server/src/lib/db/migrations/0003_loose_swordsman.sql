ALTER TABLE "product_category" RENAME TO "product_collection";--> statement-breakpoint
ALTER TABLE "product_category_assignment" RENAME TO "product_collection_assignment";--> statement-breakpoint
ALTER TABLE "product_collection_assignment" RENAME COLUMN "category_id" TO "collection_id";--> statement-breakpoint
ALTER TABLE "product_collection" DROP CONSTRAINT "product_category_organization_id_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "product_collection" DROP CONSTRAINT "product_category_parent_id_product_category_id_fk";
--> statement-breakpoint
ALTER TABLE "product_collection" DROP CONSTRAINT "product_category_created_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "product_collection" DROP CONSTRAINT "product_category_updated_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "product_collection_assignment" DROP CONSTRAINT "product_category_assignment_organization_id_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "product_collection_assignment" DROP CONSTRAINT "product_category_assignment_product_id_product_id_fk";
--> statement-breakpoint
ALTER TABLE "product_collection_assignment" DROP CONSTRAINT "product_category_assignment_category_id_product_category_id_fk";
--> statement-breakpoint
ALTER TABLE "product_collection_assignment" DROP CONSTRAINT "product_category_assignment_created_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "product_collection_assignment" DROP CONSTRAINT "product_category_assignment_updated_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "product_collection" ADD CONSTRAINT "product_collection_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_collection" ADD CONSTRAINT "product_collection_parent_id_product_collection_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."product_collection"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_collection" ADD CONSTRAINT "product_collection_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_collection" ADD CONSTRAINT "product_collection_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_collection_assignment" ADD CONSTRAINT "product_collection_assignment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_collection_assignment" ADD CONSTRAINT "product_collection_assignment_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_collection_assignment" ADD CONSTRAINT "product_collection_assignment_collection_id_product_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."product_collection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_collection_assignment" ADD CONSTRAINT "product_collection_assignment_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_collection_assignment" ADD CONSTRAINT "product_collection_assignment_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;