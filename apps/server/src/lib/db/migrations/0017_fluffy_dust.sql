CREATE TABLE "account_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"account_type_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"code_prefix" varchar(10),
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "account_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"normal_balance" varchar(10) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "gl_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"account_category_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"parent_account_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"allow_manual_entries" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "bank_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"account_name" varchar(255) NOT NULL,
	"bank_name" varchar(255) NOT NULL,
	"account_number" varchar(100) NOT NULL,
	"iban" varchar(100),
	"swift_code" varchar(20),
	"currency" varchar(3) NOT NULL,
	"account_type" varchar(20) NOT NULL,
	"gl_account_id" uuid NOT NULL,
	"opening_balance" numeric(12, 2) DEFAULT '0',
	"current_balance" numeric(12, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "bank_reconciliation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"statement_date" timestamp NOT NULL,
	"statement_opening_balance" numeric(12, 2) NOT NULL,
	"statement_closing_balance" numeric(12, 2) NOT NULL,
	"book_opening_balance" numeric(12, 2) NOT NULL,
	"book_closing_balance" numeric(12, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'in_progress' NOT NULL,
	"reconciled_by" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "bank_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"transaction_date" timestamp NOT NULL,
	"value_date" timestamp NOT NULL,
	"transaction_type" varchar(20) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"balance_after" numeric(12, 2),
	"reference_number" varchar(100),
	"description" text,
	"payee_payer" varchar(255),
	"reconciliation_status" varchar(20) DEFAULT 'unreconciled' NOT NULL,
	"reconciled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "journal_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"entry_number" varchar(50) NOT NULL,
	"entry_date" timestamp NOT NULL,
	"posting_date" timestamp,
	"entry_type" varchar(50) NOT NULL,
	"reference_type" varchar(50),
	"reference_id" uuid,
	"description" text NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	"reversed_by_entry_id" uuid,
	"reversed_at" timestamp,
	"fiscal_year" integer,
	"fiscal_period" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "journal_entry_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journal_entry_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"debit_amount" numeric(19, 4) DEFAULT '0' NOT NULL,
	"credit_amount" numeric(19, 4) DEFAULT '0' NOT NULL,
	"description" text,
	"cost_center_id" uuid,
	"department_id" uuid,
	"project_id" uuid,
	"line_number" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "check_debit_or_credit" CHECK (("journal_entry_line"."debit_amount" > 0 AND "journal_entry_line"."credit_amount" = 0) OR ("journal_entry_line"."credit_amount" > 0 AND "journal_entry_line"."debit_amount" = 0))
);
--> statement-breakpoint
CREATE TABLE "supplier_invoice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"supplier_id" uuid NOT NULL,
	"invoice_number" varchar(100) NOT NULL,
	"invoice_date" timestamp NOT NULL,
	"due_date" timestamp NOT NULL,
	"currency" varchar(3) NOT NULL,
	"exchange_rate" numeric(12, 6) DEFAULT '1',
	"total_amount" numeric(12, 2) NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0',
	"discount_amount" numeric(12, 2) DEFAULT '0',
	"net_amount" numeric(12, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"payment_status" varchar(20) DEFAULT 'unpaid',
	"approved_by" text,
	"approved_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "supplier_invoice_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_invoice_id" uuid NOT NULL,
	"expense_account_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(12, 4) DEFAULT '1',
	"unit_price" numeric(12, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"tax_amount" numeric(12, 2) DEFAULT '0',
	"total_amount" numeric(12, 2) NOT NULL,
	"cost_center_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "supplier_payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"supplier_id" uuid NOT NULL,
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
CREATE TABLE "supplier_payment_allocation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_payment_id" uuid NOT NULL,
	"supplier_invoice_id" uuid NOT NULL,
	"allocated_amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "employee" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text,
	"employee_code" varchar(50) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"department_id" uuid,
	"position" varchar(100),
	"hire_date" timestamp NOT NULL,
	"employment_type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"termination_date" timestamp,
	"bank_account_number" varchar(100),
	"tax_id" varchar(50),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "employee_salary_component" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salary_structure_id" uuid NOT NULL,
	"salary_component_id" uuid NOT NULL,
	"amount" numeric(12, 2),
	"percentage" numeric(5, 2),
	"calculation_basis" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "payroll_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payroll_run_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"base_salary" numeric(12, 2) NOT NULL,
	"gross_salary" numeric(12, 2) NOT NULL,
	"total_deductions" numeric(12, 2) DEFAULT '0',
	"net_salary" numeric(12, 2) NOT NULL,
	"employer_contributions" numeric(12, 2) DEFAULT '0',
	"payment_method" varchar(20) NOT NULL,
	"bank_account_number" varchar(100),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "payroll_entry_detail" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payroll_entry_id" uuid NOT NULL,
	"salary_component_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"is_taxable" boolean DEFAULT true NOT NULL,
	"account_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "payroll_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"payroll_period_start" timestamp NOT NULL,
	"payroll_period_end" timestamp NOT NULL,
	"payment_date" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"total_gross" numeric(12, 2) DEFAULT '0',
	"total_deductions" numeric(12, 2) DEFAULT '0',
	"total_net" numeric(12, 2) DEFAULT '0',
	"total_employer_contributions" numeric(12, 2) DEFAULT '0',
	"approved_by" text,
	"approved_at" timestamp,
	"posted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "salary_advance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"employee_id" uuid NOT NULL,
	"request_date" timestamp DEFAULT now() NOT NULL,
	"requested_amount" numeric(12, 2) NOT NULL,
	"approved_amount" numeric(12, 2),
	"number_of_installments" integer DEFAULT 1 NOT NULL,
	"deduction_per_payroll" numeric(12, 2),
	"outstanding_balance" numeric(12, 2) DEFAULT '0',
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	"rejected_by" text,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"disbursed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "salary_advance_repayment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salary_advance_id" uuid NOT NULL,
	"payroll_run_id" uuid NOT NULL,
	"repayment_amount" numeric(12, 2) NOT NULL,
	"balance_after" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "salary_component" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" varchar(100) NOT NULL,
	"component_type" varchar(30) NOT NULL,
	"calculation_type" varchar(20) NOT NULL,
	"is_taxable" boolean DEFAULT true NOT NULL,
	"account_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "salary_structure" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"employee_id" uuid NOT NULL,
	"effective_from" timestamp NOT NULL,
	"effective_to" timestamp,
	"base_salary" numeric(12, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"payment_frequency" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "customer_invoice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"invoice_number" varchar(100) NOT NULL,
	"invoice_date" timestamp NOT NULL,
	"due_date" timestamp NOT NULL,
	"currency" varchar(3) NOT NULL,
	"exchange_rate" numeric(12, 6) DEFAULT '1',
	"total_amount" numeric(12, 2) NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0',
	"discount_amount" numeric(12, 2) DEFAULT '0',
	"net_amount" numeric(12, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"payment_status" varchar(20) DEFAULT 'unpaid',
	"sent_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "customer_invoice_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_invoice_id" uuid NOT NULL,
	"revenue_account_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(12, 4) DEFAULT '1',
	"unit_price" numeric(12, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"tax_amount" numeric(12, 2) DEFAULT '0',
	"total_amount" numeric(12, 2) NOT NULL,
	"cost_center_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "customer_payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"customer_id" uuid NOT NULL,
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
CREATE TABLE "customer_payment_allocation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_payment_id" uuid NOT NULL,
	"customer_invoice_id" uuid NOT NULL,
	"allocated_amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "tax_authority" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"tax_id_label" varchar(100),
	"country" varchar(100),
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "tax_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"transaction_id" uuid NOT NULL,
	"transaction_type" varchar(50) NOT NULL,
	"tax_type_id" uuid NOT NULL,
	"taxable_amount" numeric(12, 2) NOT NULL,
	"tax_amount" numeric(12, 2) NOT NULL,
	"transaction_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "tax_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"tax_authority_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"tax_rate" numeric(5, 2) NOT NULL,
	"effective_from" timestamp NOT NULL,
	"effective_to" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
ALTER TABLE "account_category" ADD CONSTRAINT "account_category_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_category" ADD CONSTRAINT "account_category_account_type_id_account_type_id_fk" FOREIGN KEY ("account_type_id") REFERENCES "public"."account_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_category" ADD CONSTRAINT "account_category_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_category" ADD CONSTRAINT "account_category_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_account" ADD CONSTRAINT "gl_account_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_account" ADD CONSTRAINT "gl_account_account_category_id_account_category_id_fk" FOREIGN KEY ("account_category_id") REFERENCES "public"."account_category"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_account" ADD CONSTRAINT "gl_account_parent_account_id_gl_account_id_fk" FOREIGN KEY ("parent_account_id") REFERENCES "public"."gl_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_account" ADD CONSTRAINT "gl_account_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_account" ADD CONSTRAINT "gl_account_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_gl_account_id_gl_account_id_fk" FOREIGN KEY ("gl_account_id") REFERENCES "public"."gl_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_reconciliation" ADD CONSTRAINT "bank_reconciliation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_reconciliation" ADD CONSTRAINT "bank_reconciliation_bank_account_id_bank_account_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_reconciliation" ADD CONSTRAINT "bank_reconciliation_reconciled_by_user_id_fk" FOREIGN KEY ("reconciled_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_reconciliation" ADD CONSTRAINT "bank_reconciliation_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_reconciliation" ADD CONSTRAINT "bank_reconciliation_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transaction" ADD CONSTRAINT "bank_transaction_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transaction" ADD CONSTRAINT "bank_transaction_bank_account_id_bank_account_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transaction" ADD CONSTRAINT "bank_transaction_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transaction" ADD CONSTRAINT "bank_transaction_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry" ADD CONSTRAINT "journal_entry_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry" ADD CONSTRAINT "journal_entry_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry" ADD CONSTRAINT "journal_entry_reversed_by_entry_id_journal_entry_id_fk" FOREIGN KEY ("reversed_by_entry_id") REFERENCES "public"."journal_entry"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry" ADD CONSTRAINT "journal_entry_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry" ADD CONSTRAINT "journal_entry_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_line" ADD CONSTRAINT "journal_entry_line_journal_entry_id_journal_entry_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_line" ADD CONSTRAINT "journal_entry_line_account_id_gl_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."gl_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_line" ADD CONSTRAINT "journal_entry_line_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_line" ADD CONSTRAINT "journal_entry_line_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invoice" ADD CONSTRAINT "supplier_invoice_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invoice" ADD CONSTRAINT "supplier_invoice_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invoice" ADD CONSTRAINT "supplier_invoice_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invoice" ADD CONSTRAINT "supplier_invoice_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invoice" ADD CONSTRAINT "supplier_invoice_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invoice_line" ADD CONSTRAINT "supplier_invoice_line_supplier_invoice_id_supplier_invoice_id_fk" FOREIGN KEY ("supplier_invoice_id") REFERENCES "public"."supplier_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invoice_line" ADD CONSTRAINT "supplier_invoice_line_expense_account_id_gl_account_id_fk" FOREIGN KEY ("expense_account_id") REFERENCES "public"."gl_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invoice_line" ADD CONSTRAINT "supplier_invoice_line_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invoice_line" ADD CONSTRAINT "supplier_invoice_line_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_payment" ADD CONSTRAINT "supplier_payment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_payment" ADD CONSTRAINT "supplier_payment_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_payment" ADD CONSTRAINT "supplier_payment_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_payment" ADD CONSTRAINT "supplier_payment_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_payment_allocation" ADD CONSTRAINT "supplier_payment_allocation_supplier_payment_id_supplier_payment_id_fk" FOREIGN KEY ("supplier_payment_id") REFERENCES "public"."supplier_payment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_payment_allocation" ADD CONSTRAINT "supplier_payment_allocation_supplier_invoice_id_supplier_invoice_id_fk" FOREIGN KEY ("supplier_invoice_id") REFERENCES "public"."supplier_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_payment_allocation" ADD CONSTRAINT "supplier_payment_allocation_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_payment_allocation" ADD CONSTRAINT "supplier_payment_allocation_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee" ADD CONSTRAINT "employee_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee" ADD CONSTRAINT "employee_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee" ADD CONSTRAINT "employee_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee" ADD CONSTRAINT "employee_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_salary_component" ADD CONSTRAINT "employee_salary_component_salary_structure_id_salary_structure_id_fk" FOREIGN KEY ("salary_structure_id") REFERENCES "public"."salary_structure"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_salary_component" ADD CONSTRAINT "employee_salary_component_salary_component_id_salary_component_id_fk" FOREIGN KEY ("salary_component_id") REFERENCES "public"."salary_component"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_salary_component" ADD CONSTRAINT "employee_salary_component_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_salary_component" ADD CONSTRAINT "employee_salary_component_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_entry" ADD CONSTRAINT "payroll_entry_payroll_run_id_payroll_run_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_entry" ADD CONSTRAINT "payroll_entry_employee_id_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employee"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_entry" ADD CONSTRAINT "payroll_entry_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_entry" ADD CONSTRAINT "payroll_entry_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_entry_detail" ADD CONSTRAINT "payroll_entry_detail_payroll_entry_id_payroll_entry_id_fk" FOREIGN KEY ("payroll_entry_id") REFERENCES "public"."payroll_entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_entry_detail" ADD CONSTRAINT "payroll_entry_detail_salary_component_id_salary_component_id_fk" FOREIGN KEY ("salary_component_id") REFERENCES "public"."salary_component"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_entry_detail" ADD CONSTRAINT "payroll_entry_detail_account_id_gl_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."gl_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_entry_detail" ADD CONSTRAINT "payroll_entry_detail_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_entry_detail" ADD CONSTRAINT "payroll_entry_detail_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_run" ADD CONSTRAINT "payroll_run_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_run" ADD CONSTRAINT "payroll_run_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_run" ADD CONSTRAINT "payroll_run_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_run" ADD CONSTRAINT "payroll_run_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_advance" ADD CONSTRAINT "salary_advance_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_advance" ADD CONSTRAINT "salary_advance_employee_id_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_advance" ADD CONSTRAINT "salary_advance_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_advance" ADD CONSTRAINT "salary_advance_rejected_by_user_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_advance" ADD CONSTRAINT "salary_advance_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_advance" ADD CONSTRAINT "salary_advance_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_advance_repayment" ADD CONSTRAINT "salary_advance_repayment_salary_advance_id_salary_advance_id_fk" FOREIGN KEY ("salary_advance_id") REFERENCES "public"."salary_advance"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_advance_repayment" ADD CONSTRAINT "salary_advance_repayment_payroll_run_id_payroll_run_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_run"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_advance_repayment" ADD CONSTRAINT "salary_advance_repayment_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_advance_repayment" ADD CONSTRAINT "salary_advance_repayment_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_component" ADD CONSTRAINT "salary_component_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_component" ADD CONSTRAINT "salary_component_account_id_gl_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."gl_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_component" ADD CONSTRAINT "salary_component_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_component" ADD CONSTRAINT "salary_component_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_structure" ADD CONSTRAINT "salary_structure_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_structure" ADD CONSTRAINT "salary_structure_employee_id_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_structure" ADD CONSTRAINT "salary_structure_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_structure" ADD CONSTRAINT "salary_structure_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_invoice" ADD CONSTRAINT "customer_invoice_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_invoice" ADD CONSTRAINT "customer_invoice_customer_id_client_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."client"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_invoice" ADD CONSTRAINT "customer_invoice_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_invoice" ADD CONSTRAINT "customer_invoice_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_invoice_line" ADD CONSTRAINT "customer_invoice_line_customer_invoice_id_customer_invoice_id_fk" FOREIGN KEY ("customer_invoice_id") REFERENCES "public"."customer_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_invoice_line" ADD CONSTRAINT "customer_invoice_line_revenue_account_id_gl_account_id_fk" FOREIGN KEY ("revenue_account_id") REFERENCES "public"."gl_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_invoice_line" ADD CONSTRAINT "customer_invoice_line_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_invoice_line" ADD CONSTRAINT "customer_invoice_line_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_payment" ADD CONSTRAINT "customer_payment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_payment" ADD CONSTRAINT "customer_payment_customer_id_client_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."client"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_payment" ADD CONSTRAINT "customer_payment_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_payment" ADD CONSTRAINT "customer_payment_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_payment_allocation" ADD CONSTRAINT "customer_payment_allocation_customer_payment_id_customer_payment_id_fk" FOREIGN KEY ("customer_payment_id") REFERENCES "public"."customer_payment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_payment_allocation" ADD CONSTRAINT "customer_payment_allocation_customer_invoice_id_customer_invoice_id_fk" FOREIGN KEY ("customer_invoice_id") REFERENCES "public"."customer_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_payment_allocation" ADD CONSTRAINT "customer_payment_allocation_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_payment_allocation" ADD CONSTRAINT "customer_payment_allocation_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_authority" ADD CONSTRAINT "tax_authority_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_authority" ADD CONSTRAINT "tax_authority_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_authority" ADD CONSTRAINT "tax_authority_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_transaction" ADD CONSTRAINT "tax_transaction_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_transaction" ADD CONSTRAINT "tax_transaction_tax_type_id_tax_type_id_fk" FOREIGN KEY ("tax_type_id") REFERENCES "public"."tax_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_transaction" ADD CONSTRAINT "tax_transaction_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_transaction" ADD CONSTRAINT "tax_transaction_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_type" ADD CONSTRAINT "tax_type_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_type" ADD CONSTRAINT "tax_type_tax_authority_id_tax_authority_id_fk" FOREIGN KEY ("tax_authority_id") REFERENCES "public"."tax_authority"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_type" ADD CONSTRAINT "tax_type_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_type" ADD CONSTRAINT "tax_type_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_category_org_idx" ON "account_category" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "gl_account_org_idx" ON "gl_account" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "gl_account_code_idx" ON "gl_account" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "gl_account_category_idx" ON "gl_account" USING btree ("account_category_id");--> statement-breakpoint
CREATE INDEX "gl_account_parent_idx" ON "gl_account" USING btree ("parent_account_id");--> statement-breakpoint
CREATE INDEX "bank_account_org_idx" ON "bank_account" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "bank_account_gl_idx" ON "bank_account" USING btree ("gl_account_id");--> statement-breakpoint
CREATE INDEX "bank_reconciliation_org_idx" ON "bank_reconciliation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "bank_reconciliation_account_idx" ON "bank_reconciliation" USING btree ("bank_account_id");--> statement-breakpoint
CREATE INDEX "bank_reconciliation_date_idx" ON "bank_reconciliation" USING btree ("statement_date");--> statement-breakpoint
CREATE INDEX "bank_transaction_org_idx" ON "bank_transaction" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "bank_transaction_account_idx" ON "bank_transaction" USING btree ("bank_account_id");--> statement-breakpoint
CREATE INDEX "bank_transaction_date_idx" ON "bank_transaction" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "bank_transaction_reconciliation_idx" ON "bank_transaction" USING btree ("reconciliation_status");--> statement-breakpoint
CREATE INDEX "journal_entry_org_idx" ON "journal_entry" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "journal_entry_number_idx" ON "journal_entry" USING btree ("organization_id","entry_number");--> statement-breakpoint
CREATE INDEX "journal_entry_date_idx" ON "journal_entry" USING btree ("entry_date");--> statement-breakpoint
CREATE INDEX "journal_entry_status_idx" ON "journal_entry" USING btree ("status");--> statement-breakpoint
CREATE INDEX "journal_entry_reference_idx" ON "journal_entry" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "journal_entry_line_entry_idx" ON "journal_entry_line" USING btree ("journal_entry_id");--> statement-breakpoint
CREATE INDEX "journal_entry_line_account_idx" ON "journal_entry_line" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "supplier_invoice_org_idx" ON "supplier_invoice" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "supplier_invoice_supplier_idx" ON "supplier_invoice" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "supplier_invoice_number_idx" ON "supplier_invoice" USING btree ("organization_id","invoice_number");--> statement-breakpoint
CREATE INDEX "supplier_invoice_status_idx" ON "supplier_invoice" USING btree ("status");--> statement-breakpoint
CREATE INDEX "supplier_invoice_due_date_idx" ON "supplier_invoice" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "supplier_invoice_line_invoice_idx" ON "supplier_invoice_line" USING btree ("supplier_invoice_id");--> statement-breakpoint
CREATE INDEX "supplier_invoice_line_account_idx" ON "supplier_invoice_line" USING btree ("expense_account_id");--> statement-breakpoint
CREATE INDEX "supplier_payment_org_idx" ON "supplier_payment" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "supplier_payment_supplier_idx" ON "supplier_payment" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "supplier_payment_number_idx" ON "supplier_payment" USING btree ("organization_id","payment_number");--> statement-breakpoint
CREATE INDEX "supplier_payment_date_idx" ON "supplier_payment" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "supplier_payment_allocation_payment_idx" ON "supplier_payment_allocation" USING btree ("supplier_payment_id");--> statement-breakpoint
CREATE INDEX "supplier_payment_allocation_invoice_idx" ON "supplier_payment_allocation" USING btree ("supplier_invoice_id");--> statement-breakpoint
CREATE INDEX "employee_org_idx" ON "employee" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "employee_code_idx" ON "employee" USING btree ("organization_id","employee_code");--> statement-breakpoint
CREATE INDEX "employee_status_idx" ON "employee" USING btree ("status");--> statement-breakpoint
CREATE INDEX "employee_salary_component_structure_idx" ON "employee_salary_component" USING btree ("salary_structure_id");--> statement-breakpoint
CREATE INDEX "employee_salary_component_component_idx" ON "employee_salary_component" USING btree ("salary_component_id");--> statement-breakpoint
CREATE INDEX "payroll_entry_run_idx" ON "payroll_entry" USING btree ("payroll_run_id");--> statement-breakpoint
CREATE INDEX "payroll_entry_employee_idx" ON "payroll_entry" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "payroll_entry_detail_entry_idx" ON "payroll_entry_detail" USING btree ("payroll_entry_id");--> statement-breakpoint
CREATE INDEX "payroll_entry_detail_component_idx" ON "payroll_entry_detail" USING btree ("salary_component_id");--> statement-breakpoint
CREATE INDEX "payroll_run_org_idx" ON "payroll_run" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payroll_run_period_idx" ON "payroll_run" USING btree ("payroll_period_start","payroll_period_end");--> statement-breakpoint
CREATE INDEX "payroll_run_status_idx" ON "payroll_run" USING btree ("status");--> statement-breakpoint
CREATE INDEX "salary_advance_org_idx" ON "salary_advance" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "salary_advance_employee_idx" ON "salary_advance" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "salary_advance_status_idx" ON "salary_advance" USING btree ("status");--> statement-breakpoint
CREATE INDEX "salary_advance_repayment_advance_idx" ON "salary_advance_repayment" USING btree ("salary_advance_id");--> statement-breakpoint
CREATE INDEX "salary_advance_repayment_payroll_idx" ON "salary_advance_repayment" USING btree ("payroll_run_id");--> statement-breakpoint
CREATE INDEX "salary_component_org_idx" ON "salary_component" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "salary_component_type_idx" ON "salary_component" USING btree ("component_type");--> statement-breakpoint
CREATE INDEX "salary_structure_org_idx" ON "salary_structure" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "salary_structure_employee_idx" ON "salary_structure" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "salary_structure_effective_idx" ON "salary_structure" USING btree ("effective_from","effective_to");--> statement-breakpoint
CREATE INDEX "customer_invoice_org_idx" ON "customer_invoice" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "customer_invoice_customer_idx" ON "customer_invoice" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_invoice_number_idx" ON "customer_invoice" USING btree ("organization_id","invoice_number");--> statement-breakpoint
CREATE INDEX "customer_invoice_status_idx" ON "customer_invoice" USING btree ("status");--> statement-breakpoint
CREATE INDEX "customer_invoice_due_date_idx" ON "customer_invoice" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "customer_invoice_line_invoice_idx" ON "customer_invoice_line" USING btree ("customer_invoice_id");--> statement-breakpoint
CREATE INDEX "customer_invoice_line_account_idx" ON "customer_invoice_line" USING btree ("revenue_account_id");--> statement-breakpoint
CREATE INDEX "customer_payment_org_idx" ON "customer_payment" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "customer_payment_customer_idx" ON "customer_payment" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_payment_number_idx" ON "customer_payment" USING btree ("organization_id","payment_number");--> statement-breakpoint
CREATE INDEX "customer_payment_date_idx" ON "customer_payment" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "customer_payment_allocation_payment_idx" ON "customer_payment_allocation" USING btree ("customer_payment_id");--> statement-breakpoint
CREATE INDEX "customer_payment_allocation_invoice_idx" ON "customer_payment_allocation" USING btree ("customer_invoice_id");--> statement-breakpoint
CREATE INDEX "tax_authority_org_idx" ON "tax_authority" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "tax_transaction_org_idx" ON "tax_transaction" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "tax_transaction_type_idx" ON "tax_transaction" USING btree ("tax_type_id");--> statement-breakpoint
CREATE INDEX "tax_transaction_source_idx" ON "tax_transaction" USING btree ("transaction_type","transaction_id");--> statement-breakpoint
CREATE INDEX "tax_transaction_date_idx" ON "tax_transaction" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "tax_type_org_idx" ON "tax_type" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "tax_type_authority_idx" ON "tax_type" USING btree ("tax_authority_id");--> statement-breakpoint
CREATE INDEX "tax_type_effective_idx" ON "tax_type" USING btree ("effective_from","effective_to");