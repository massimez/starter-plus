import { Hono } from "hono";
import accountingRoutes from "./accounting/route";
import expensesRoutes from "./expenses/route";
import payrollRoutes from "./payroll/route";

const app = new Hono();

// Mount all financial sub-modules
app.route("/accounting", accountingRoutes);
app.route("/expenses", expensesRoutes);
app.route("/payroll", payrollRoutes);

export default app;
