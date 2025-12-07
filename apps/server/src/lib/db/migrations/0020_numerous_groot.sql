ALTER TABLE "employee" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "salary_component" ADD COLUMN "is_taxable" boolean DEFAULT true NOT NULL;