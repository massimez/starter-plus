CREATE TABLE "invoice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"invoice_type" varchar(20) NOT NULL,
	"party_type" varchar(20) NOT NULL,
	"customer_id" uuid,
	"supplier_id" uuid,
	"invoice_number" varchar(100) NOT NULL,
	"invoice_date" timestamp NOT NULL,
	"due_date" timestamp NOT NULL,
	"currency" varchar(3) NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0',
	"discount_amount" numeric(12, 2) DEFAULT '0',
	"net_amount" numeric(12, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"sent_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "invoice_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(12, 4) DEFAULT '1',
	"unit_price" numeric(12, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"tax_amount" numeric(12, 2) DEFAULT '0',
	"total_amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"payment_type" varchar(20) NOT NULL,
	"party_type" varchar(20) NOT NULL,
	"customer_id" uuid,
	"supplier_id" uuid,
	"payment_number" varchar(100) NOT NULL,
	"payment_date" timestamp NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"reference_number" varchar(100),
	"bank_account_id" uuid,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "payment_allocation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"allocated_amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
ALTER TABLE "account_category" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "account_type" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bank_reconciliation" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "supplier_invoice" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "supplier_invoice_line" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "supplier_payment" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "supplier_payment_allocation" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "employee_salary_component" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payroll_entry_detail" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "salary_advance_repayment" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "salary_structure" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "customer_invoice" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "customer_invoice_line" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "customer_payment" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "customer_payment_allocation" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tax_authority" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tax_transaction" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tax_type" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "account_category" CASCADE;--> statement-breakpoint
DROP TABLE "account_type" CASCADE;--> statement-breakpoint
DROP TABLE "bank_reconciliation" CASCADE;--> statement-breakpoint
DROP TABLE "supplier_invoice" CASCADE;--> statement-breakpoint
DROP TABLE "supplier_invoice_line" CASCADE;--> statement-breakpoint
DROP TABLE "supplier_payment" CASCADE;--> statement-breakpoint
DROP TABLE "supplier_payment_allocation" CASCADE;--> statement-breakpoint
DROP TABLE "employee_salary_component" CASCADE;--> statement-breakpoint
DROP TABLE "payroll_entry_detail" CASCADE;--> statement-breakpoint
DROP TABLE "salary_advance_repayment" CASCADE;--> statement-breakpoint
DROP TABLE "salary_structure" CASCADE;--> statement-breakpoint
DROP TABLE "customer_invoice" CASCADE;--> statement-breakpoint
DROP TABLE "customer_invoice_line" CASCADE;--> statement-breakpoint
DROP TABLE "customer_payment" CASCADE;--> statement-breakpoint
DROP TABLE "customer_payment_allocation" CASCADE;--> statement-breakpoint
DROP TABLE "tax_authority" CASCADE;--> statement-breakpoint
DROP TABLE "tax_transaction" CASCADE;--> statement-breakpoint
DROP TABLE "tax_type" CASCADE;--> statement-breakpoint
ALTER TABLE "expense" DROP CONSTRAINT IF EXISTS "expense_employee_id_employee_id_fk";
--> statement-breakpoint
ALTER TABLE "expense" DROP CONSTRAINT IF EXISTS "expense_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "journal_entry" DROP CONSTRAINT IF EXISTS "journal_entry_reversed_by_entry_id_journal_entry_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "gl_account_category_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "gl_account_parent_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "bank_transaction_reconciliation_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "expense_employee_idx";--> statement-breakpoint
ALTER TABLE "expense" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
-- Add columns with defaults for existing data
ALTER TABLE "gl_account" ADD COLUMN "account_type" varchar(20) DEFAULT 'asset';--> statement-breakpoint
ALTER TABLE "gl_account" ADD COLUMN "category" varchar(100);--> statement-breakpoint
ALTER TABLE "gl_account" ADD COLUMN "normal_balance" varchar(10) DEFAULT 'debit';--> statement-breakpoint
-- Set NOT NULL after adding defaults
ALTER TABLE "gl_account" ALTER COLUMN "account_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "gl_account" ALTER COLUMN "normal_balance" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "employee" ADD COLUMN "base_salary" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "employee" ADD COLUMN "currency" varchar(3);--> statement-breakpoint
ALTER TABLE "employee" ADD COLUMN "payment_frequency" varchar(20);--> statement-breakpoint
ALTER TABLE "employee" ADD COLUMN "salary_components" jsonb;--> statement-breakpoint
ALTER TABLE "payroll_entry" ADD COLUMN "components" jsonb;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_customer_id_client_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."client"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_account_id_gl_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."gl_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_customer_id_client_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."client"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocation" ADD CONSTRAINT "payment_allocation_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocation" ADD CONSTRAINT "payment_allocation_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocation" ADD CONSTRAINT "payment_allocation_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocation" ADD CONSTRAINT "payment_allocation_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoice_org_idx" ON "invoice" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invoice_customer_idx" ON "invoice" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "invoice_supplier_idx" ON "invoice" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "invoice_number_idx" ON "invoice" USING btree ("organization_id","invoice_number");--> statement-breakpoint
CREATE INDEX "invoice_status_idx" ON "invoice" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoice_type_idx" ON "invoice" USING btree ("invoice_type");--> statement-breakpoint
CREATE INDEX "invoice_due_date_idx" ON "invoice" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "invoice_line_invoice_idx" ON "invoice_line" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_line_account_idx" ON "invoice_line" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "payment_org_idx" ON "payment" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payment_customer_idx" ON "payment" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "payment_supplier_idx" ON "payment" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "payment_number_idx" ON "payment" USING btree ("organization_id","payment_number");--> statement-breakpoint
CREATE INDEX "payment_type_idx" ON "payment" USING btree ("payment_type");--> statement-breakpoint
CREATE INDEX "payment_date_idx" ON "payment" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "payment_allocation_payment_idx" ON "payment_allocation" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "payment_allocation_invoice_idx" ON "payment_allocation" USING btree ("invoice_id");--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gl_account_type_idx" ON "gl_account" USING btree ("account_type");--> statement-breakpoint
CREATE INDEX "expense_user_idx" ON "expense" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "gl_account" DROP COLUMN "account_category_id";--> statement-breakpoint
ALTER TABLE "gl_account" DROP COLUMN "parent_account_id";--> statement-breakpoint
ALTER TABLE "bank_account" DROP COLUMN "opening_balance";--> statement-breakpoint
ALTER TABLE "bank_transaction" DROP COLUMN "value_date";--> statement-breakpoint
ALTER TABLE "bank_transaction" DROP COLUMN "reconciliation_status";--> statement-breakpoint
ALTER TABLE "bank_transaction" DROP COLUMN "reconciled_at";--> statement-breakpoint
ALTER TABLE "expense" DROP COLUMN "employee_id";--> statement-breakpoint
ALTER TABLE "journal_entry" DROP COLUMN "reversed_by_entry_id";--> statement-breakpoint
ALTER TABLE "journal_entry" DROP COLUMN "reversed_at";--> statement-breakpoint
ALTER TABLE "journal_entry" DROP COLUMN "fiscal_year";--> statement-breakpoint
ALTER TABLE "journal_entry" DROP COLUMN "fiscal_period";--> statement-breakpoint
ALTER TABLE "journal_entry_line" DROP COLUMN "cost_center_id";--> statement-breakpoint
ALTER TABLE "journal_entry_line" DROP COLUMN "department_id";--> statement-breakpoint
ALTER TABLE "journal_entry_line" DROP COLUMN "project_id";--> statement-breakpoint
ALTER TABLE "employee" DROP COLUMN "department_id";--> statement-breakpoint
ALTER TABLE "employee" DROP COLUMN "metadata";--> statement-breakpoint
ALTER TABLE "payroll_entry" DROP COLUMN "employer_contributions";--> statement-breakpoint
ALTER TABLE "payroll_run" DROP COLUMN "total_employer_contributions";--> statement-breakpoint
ALTER TABLE "payroll_run" DROP COLUMN "posted_at";--> statement-breakpoint
ALTER TABLE "salary_advance" DROP COLUMN "number_of_installments";--> statement-breakpoint
ALTER TABLE "salary_advance" DROP COLUMN "deduction_per_payroll";--> statement-breakpoint
ALTER TABLE "salary_component" DROP COLUMN "calculation_type";--> statement-breakpoint
ALTER TABLE "salary_component" DROP COLUMN "is_taxable";