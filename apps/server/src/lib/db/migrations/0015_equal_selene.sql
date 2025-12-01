CREATE TABLE "bonus_coupon" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"reward_id" uuid NOT NULL,
	"bonus_transaction_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"type" text NOT NULL,
	"discount_percentage" numeric(5, 2),
	"discount_amount" numeric(12, 2),
	"min_order_amount" numeric(12, 2),
	"status" text DEFAULT 'active' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"used_in_order_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "bonus_coupon_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "bonus_milestone" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"bonus_program_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"target_value" numeric(12, 2) NOT NULL,
	"reward_points" integer NOT NULL,
	"is_repeatable" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "bonus_program" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"points_per_dollar" numeric(12, 2) DEFAULT '1.00',
	"min_order_amount" numeric(12, 2) DEFAULT '0.00',
	"max_points_per_order" integer,
	"points_expire_days" integer,
	"signup_bonus" integer DEFAULT 0,
	"referral_bonus_referrer" integer DEFAULT 0,
	"referral_bonus_referee" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "bonus_tier" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"bonus_program_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"min_points" integer NOT NULL,
	"multiplier" numeric(5, 2) DEFAULT '1.00',
	"description" text,
	"benefits" jsonb,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "bonus_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"user_bonus_account_id" uuid NOT NULL,
	"type" text NOT NULL,
	"points" integer NOT NULL,
	"balance_before" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"order_id" uuid,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "points_expiration" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"user_bonus_account_id" uuid NOT NULL,
	"bonus_transaction_id" uuid NOT NULL,
	"points" integer NOT NULL,
	"remaining_points" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_expired" boolean DEFAULT false,
	"expired_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "referral" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"bonus_program_id" uuid NOT NULL,
	"referrer_id" text NOT NULL,
	"referred_user_id" text,
	"referral_code" varchar(50) NOT NULL,
	"signed_up_at" timestamp,
	"referrer_bonus_given" boolean DEFAULT false,
	"referrer_transaction_id" uuid,
	"referee_bonus_given" boolean DEFAULT false,
	"referee_transaction_id" uuid,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "referral_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "reward" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"bonus_program_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"points_cost" integer NOT NULL,
	"cash_amount" numeric(12, 2),
	"discount_percentage" numeric(5, 2),
	"discount_amount" numeric(12, 2),
	"min_order_amount" numeric(12, 2),
	"max_redemptions_per_user" integer,
	"total_redemptions_limit" integer,
	"current_redemptions" integer DEFAULT 0,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"image" varchar(255),
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "user_bonus_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"bonus_program_id" uuid NOT NULL,
	"current_points" integer DEFAULT 0 NOT NULL,
	"pending_points" integer DEFAULT 0 NOT NULL,
	"total_earned_points" integer DEFAULT 0 NOT NULL,
	"total_redeemed_points" integer DEFAULT 0 NOT NULL,
	"total_expired_points" integer DEFAULT 0 NOT NULL,
	"current_tier_id" uuid,
	"tier_progress" numeric(5, 2) DEFAULT '0.00',
	"last_earned_at" timestamp,
	"last_redeemed_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "user_milestone_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"milestone_id" uuid NOT NULL,
	"current_value" numeric(12, 2) DEFAULT '0',
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"completion_count" integer DEFAULT 0,
	"bonus_transaction_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
DROP TABLE "user_bonus" CASCADE;--> statement-breakpoint
ALTER TABLE "bonus_coupon" ADD CONSTRAINT "bonus_coupon_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_coupon" ADD CONSTRAINT "bonus_coupon_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_coupon" ADD CONSTRAINT "bonus_coupon_reward_id_reward_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."reward"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_coupon" ADD CONSTRAINT "bonus_coupon_bonus_transaction_id_bonus_transaction_id_fk" FOREIGN KEY ("bonus_transaction_id") REFERENCES "public"."bonus_transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_coupon" ADD CONSTRAINT "bonus_coupon_used_in_order_id_order_id_fk" FOREIGN KEY ("used_in_order_id") REFERENCES "public"."order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_coupon" ADD CONSTRAINT "bonus_coupon_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_coupon" ADD CONSTRAINT "bonus_coupon_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_milestone" ADD CONSTRAINT "bonus_milestone_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_milestone" ADD CONSTRAINT "bonus_milestone_bonus_program_id_bonus_program_id_fk" FOREIGN KEY ("bonus_program_id") REFERENCES "public"."bonus_program"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_milestone" ADD CONSTRAINT "bonus_milestone_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_milestone" ADD CONSTRAINT "bonus_milestone_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_program" ADD CONSTRAINT "bonus_program_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_program" ADD CONSTRAINT "bonus_program_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_program" ADD CONSTRAINT "bonus_program_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_tier" ADD CONSTRAINT "bonus_tier_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_tier" ADD CONSTRAINT "bonus_tier_bonus_program_id_bonus_program_id_fk" FOREIGN KEY ("bonus_program_id") REFERENCES "public"."bonus_program"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_tier" ADD CONSTRAINT "bonus_tier_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_tier" ADD CONSTRAINT "bonus_tier_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_transaction" ADD CONSTRAINT "bonus_transaction_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_transaction" ADD CONSTRAINT "bonus_transaction_user_bonus_account_id_user_bonus_account_id_fk" FOREIGN KEY ("user_bonus_account_id") REFERENCES "public"."user_bonus_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_transaction" ADD CONSTRAINT "bonus_transaction_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_transaction" ADD CONSTRAINT "bonus_transaction_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_transaction" ADD CONSTRAINT "bonus_transaction_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_expiration" ADD CONSTRAINT "points_expiration_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_expiration" ADD CONSTRAINT "points_expiration_user_bonus_account_id_user_bonus_account_id_fk" FOREIGN KEY ("user_bonus_account_id") REFERENCES "public"."user_bonus_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_expiration" ADD CONSTRAINT "points_expiration_bonus_transaction_id_bonus_transaction_id_fk" FOREIGN KEY ("bonus_transaction_id") REFERENCES "public"."bonus_transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_expiration" ADD CONSTRAINT "points_expiration_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_expiration" ADD CONSTRAINT "points_expiration_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_bonus_program_id_bonus_program_id_fk" FOREIGN KEY ("bonus_program_id") REFERENCES "public"."bonus_program"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_referrer_id_user_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_referred_user_id_user_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_referrer_transaction_id_bonus_transaction_id_fk" FOREIGN KEY ("referrer_transaction_id") REFERENCES "public"."bonus_transaction"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_referee_transaction_id_bonus_transaction_id_fk" FOREIGN KEY ("referee_transaction_id") REFERENCES "public"."bonus_transaction"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward" ADD CONSTRAINT "reward_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward" ADD CONSTRAINT "reward_bonus_program_id_bonus_program_id_fk" FOREIGN KEY ("bonus_program_id") REFERENCES "public"."bonus_program"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward" ADD CONSTRAINT "reward_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward" ADD CONSTRAINT "reward_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bonus_account" ADD CONSTRAINT "user_bonus_account_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bonus_account" ADD CONSTRAINT "user_bonus_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bonus_account" ADD CONSTRAINT "user_bonus_account_bonus_program_id_bonus_program_id_fk" FOREIGN KEY ("bonus_program_id") REFERENCES "public"."bonus_program"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bonus_account" ADD CONSTRAINT "user_bonus_account_current_tier_id_bonus_tier_id_fk" FOREIGN KEY ("current_tier_id") REFERENCES "public"."bonus_tier"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bonus_account" ADD CONSTRAINT "user_bonus_account_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bonus_account" ADD CONSTRAINT "user_bonus_account_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_milestone_progress" ADD CONSTRAINT "user_milestone_progress_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_milestone_progress" ADD CONSTRAINT "user_milestone_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_milestone_progress" ADD CONSTRAINT "user_milestone_progress_milestone_id_bonus_milestone_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."bonus_milestone"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_milestone_progress" ADD CONSTRAINT "user_milestone_progress_bonus_transaction_id_bonus_transaction_id_fk" FOREIGN KEY ("bonus_transaction_id") REFERENCES "public"."bonus_transaction"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_milestone_progress" ADD CONSTRAINT "user_milestone_progress_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_milestone_progress" ADD CONSTRAINT "user_milestone_progress_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bonus_coupon_user_idx" ON "bonus_coupon" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bonus_coupon_status_idx" ON "bonus_coupon" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "bonus_coupon_code_idx" ON "bonus_coupon" USING btree ("code");--> statement-breakpoint
CREATE INDEX "bonus_milestone_program_idx" ON "bonus_milestone" USING btree ("bonus_program_id");--> statement-breakpoint
CREATE INDEX "bonus_milestone_active_idx" ON "bonus_milestone" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "bonus_program_org_idx" ON "bonus_program" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "bonus_tier_program_idx" ON "bonus_tier" USING btree ("bonus_program_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bonus_tier_slug_org_idx" ON "bonus_tier" USING btree ("slug","organization_id");--> statement-breakpoint
CREATE INDEX "bonus_transaction_account_idx" ON "bonus_transaction" USING btree ("user_bonus_account_id");--> statement-breakpoint
CREATE INDEX "bonus_transaction_order_idx" ON "bonus_transaction" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "bonus_transaction_status_idx" ON "bonus_transaction" USING btree ("status");--> statement-breakpoint
CREATE INDEX "points_expiration_account_idx" ON "points_expiration" USING btree ("user_bonus_account_id");--> statement-breakpoint
CREATE INDEX "points_expiration_expires_idx" ON "points_expiration" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "points_expiration_expired_idx" ON "points_expiration" USING btree ("is_expired");--> statement-breakpoint
CREATE INDEX "referral_referrer_idx" ON "referral" USING btree ("referrer_id");--> statement-breakpoint
CREATE INDEX "referral_referred_idx" ON "referral" USING btree ("referred_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "referral_code_idx" ON "referral" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "reward_program_idx" ON "reward" USING btree ("bonus_program_id");--> statement-breakpoint
CREATE INDEX "reward_active_idx" ON "reward" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "user_bonus_account_user_program_idx" ON "user_bonus_account" USING btree ("user_id","bonus_program_id");--> statement-breakpoint
CREATE INDEX "user_bonus_account_org_idx" ON "user_bonus_account" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_milestone_progress_user_milestone_idx" ON "user_milestone_progress" USING btree ("user_id","milestone_id");--> statement-breakpoint
CREATE INDEX "user_milestone_progress_completed_idx" ON "user_milestone_progress" USING btree ("is_completed");--> statement-breakpoint
ALTER TABLE "organization_info" DROP COLUMN "bonus_percentage";