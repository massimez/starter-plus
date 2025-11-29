CREATE TABLE "organization_storage_limits" (
	"organization_id" text PRIMARY KEY NOT NULL,
	"storage_limit" bigint DEFAULT 1073741824 NOT NULL,
	"current_usage" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_info" ALTER COLUMN "travel_fee_value" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "organization_info" ALTER COLUMN "travel_fee_value_by_km" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "organization_info" ALTER COLUMN "minimum_travel_fees" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "uploads" ADD COLUMN "organization_id" text;--> statement-breakpoint
ALTER TABLE "organization_storage_limits" ADD CONSTRAINT "organization_storage_limits_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Fix duplicate SKUs before creating unique constraint
DO $$
DECLARE
    r RECORD;
    counter INTEGER;
    variant_id uuid;
BEGIN
    -- Loop through all duplicate SKU groups
    FOR r IN (
        SELECT organization_id, sku, ARRAY_AGG(id ORDER BY created_at) as variant_ids
        FROM product_variant
        GROUP BY organization_id, sku
        HAVING COUNT(*) > 1
    )
    LOOP
        counter := 1;
        -- Update all but the first variant in each duplicate group
        FOR i IN 2..array_length(r.variant_ids, 1)
        LOOP
            variant_id := r.variant_ids[i];
            UPDATE product_variant
            SET sku = r.sku || '-' || counter
            WHERE id = variant_id;
            counter := counter + 1;
        END LOOP;
    END LOOP;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX "product_variant_org_sku_idx" ON "product_variant" USING btree ("organization_id","sku");