ALTER TABLE "order" DROP CONSTRAINT "order_location_id_location_id_fk";
--> statement-breakpoint
ALTER TABLE "order" DROP COLUMN "location_id";