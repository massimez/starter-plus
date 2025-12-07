import { createRouter } from "@/lib/create-hono-app";
import accountingRoutes from "./accounting/route";
import bankingRoutes from "./banking/route";
import expensesRoutes from "./expenses/route";
import invoicesRoutes from "./invoices/route";
import { payoutRoute } from "./payout/route";
import payrollRoutes from "./payroll/route";
import transactionsRoutes from "./transactions/route";

export const financialRoute = createRouter()
	.route("/", payoutRoute)
	.route("/accounting", accountingRoutes)
	.route("/invoices", invoicesRoutes)
	.route("/payroll", payrollRoutes)
	.route("/banking", bankingRoutes)
	.route("/expenses", expensesRoutes)
	.route("/transactions", transactionsRoutes);
