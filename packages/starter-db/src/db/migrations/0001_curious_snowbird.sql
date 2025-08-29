ALTER TABLE "product_category_translation" DROP CONSTRAINT "product_category_translation_language_id_language_id_fk";
--> statement-breakpoint
ALTER TABLE "product_variant_translation" DROP CONSTRAINT "product_variant_translation_language_id_language_id_fk";
--> statement-breakpoint
ALTER TABLE "product_category_translation" ALTER COLUMN "language_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "product_variant_translation" ALTER COLUMN "language_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "product_category_translation" ADD CONSTRAINT "product_category_translation_language_id_language_code_fk" FOREIGN KEY ("language_id") REFERENCES "public"."language"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant_translation" ADD CONSTRAINT "product_variant_translation_language_id_language_code_fk" FOREIGN KEY ("language_id") REFERENCES "public"."language"("code") ON DELETE cascade ON UPDATE no action;