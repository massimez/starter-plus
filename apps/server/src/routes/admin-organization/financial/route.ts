import { Hono } from "hono";
import accountingRoutes from "./accounting/route";
import bankingRoutes from "./banking/route";
import expensesRoutes from "./expenses/route";
import payablesRoutes from "./payables/route";
import payrollRoutes from "./payroll/route";
import receivablesRoutes from "./receivables/route";

const app = new Hono();

// Mount all financial sub-modules
app.route("/accounting", accountingRoutes);
app.route("/expenses", expensesRoutes);
app.route("/payables", payablesRoutes);
app.route("/receivables", receivablesRoutes);
app.route("/payroll", payrollRoutes);
app.route("/banking", bankingRoutes);

export default app;
