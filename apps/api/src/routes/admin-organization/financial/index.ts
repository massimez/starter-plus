import { createRouter } from "@/lib/create-hono-app";
import accountingRoutes from "./accounting/route";
import expensesRoutes from "./expenses/route";
import invoicesRoutes from "./invoices/route";
import { payoutRoute } from "./payout/route";
import payrollRoutes from "./payroll/route";

export const financialRoute = createRouter()
	.route("/", payoutRoute)
	.route("/accounting", accountingRoutes)
	.route("/invoices", invoicesRoutes)
	.route("/payroll", payrollRoutes)
	.route("/expenses", expensesRoutes);
