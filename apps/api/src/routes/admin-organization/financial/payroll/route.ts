import { z } from "zod";
import type { User } from "@/lib/auth";
import { createRouter } from "@/lib/create-hono-app";
import {
	createSuccessResponse,
	handleRouteError,
} from "@/lib/utils/route-helpers";
import {
	jsonValidator,
	paramValidator,
	validateOrgId,
} from "@/lib/utils/validator";
import { hasOrgPermission } from "@/middleware/org-permission";
import * as payrollService from "./payroll.service";
import {
	approveSalaryAdvanceSchema,
	createEmployeeSchema,
	createPayrollRunSchema,
	createSalaryComponentSchema,
	createSalaryStructureSchema,
	processPayrollPaymentsSchema,
	requestSalaryAdvanceSchema,
	updateEmployeeSchema,
	updatePayrollEntrySchema,
} from "./schema";

export default createRouter()
	/**
	 * EMPLOYEE ROUTES
	 */
	.post(
		"/employees",
		hasOrgPermission("employee:create"),
		jsonValidator(createEmployeeSchema),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const userId = c.get("user")?.id as string;
				const data = c.req.valid("json");
				const employee = await payrollService.createEmployee(activeOrgId, {
					...data,
					createdBy: userId,
					organizationId: activeOrgId,
				});
				return c.json(createSuccessResponse(employee), 201);
			} catch (error) {
				return handleRouteError(c, error, "create employee");
			}
		},
	)

	/**
	 * PAYROLL RUN ROUTES
	 */
	.post(
		"/payroll-runs",
		hasOrgPermission("payroll:create"),
		jsonValidator(createPayrollRunSchema),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const userId = c.get("user")?.id as string;
				const data = c.req.valid("json");
				const run = await payrollService.createPayrollRun(activeOrgId, {
					...data,
					createdBy: userId,
				});
				return c.json(createSuccessResponse(run), 201);
			} catch (error) {
				return handleRouteError(c, error, "create payroll run");
			}
		},
	)

	.delete(
		"/payroll-runs/:id",
		hasOrgPermission("payroll:delete"),
		paramValidator(z.object({ id: z.string().uuid() })),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { id } = c.req.valid("param");
				await payrollService.deletePayrollRun(activeOrgId, id);
				return c.json(
					createSuccessResponse({
						message: "Payroll run deleted successfully",
					}),
				);
			} catch (error) {
				return handleRouteError(c, error, "delete payroll run");
			}
		},
	)

	.post(
		"/payroll-runs/:id/calculate",
		hasOrgPermission("payroll:calculate"),
		paramValidator(z.object({ id: z.string().uuid() })),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { id } = c.req.valid("param");
				await payrollService.calculatePayroll(activeOrgId, id);
				return c.json(
					createSuccessResponse({ message: "Payroll calculated successfully" }),
				);
			} catch (error) {
				return handleRouteError(c, error, "calculate payroll");
			}
		},
	)

	.post(
		"/payroll-runs/:id/approve",
		hasOrgPermission("payroll:approve"),
		paramValidator(z.object({ id: z.string().uuid() })),
		async (c) => {
			try {
				const userId = c.get("user")?.id as string;
				const { id } = c.req.valid("param");
				const run = await payrollService.approvePayrollRun(id, userId);
				return c.json(createSuccessResponse(run));
			} catch (error) {
				return handleRouteError(c, error, "approve payroll run");
			}
		},
	)

	/**
	 * SALARY ADVANCE ROUTES
	 */
	.post(
		"/salary-advances",
		hasOrgPermission("salary_advance:request"),
		jsonValidator(requestSalaryAdvanceSchema),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const userId = c.get("user")?.id as string;
				const data = c.req.valid("json");
				const advance = await payrollService.requestSalaryAdvance(activeOrgId, {
					...data,
					createdBy: userId,
				});
				return c.json(createSuccessResponse(advance), 201);
			} catch (error) {
				return handleRouteError(c, error, "request salary advance");
			}
		},
	)

	.post(
		"/salary-advances/:id/approve",
		hasOrgPermission("salary_advance:approve"),
		paramValidator(z.object({ id: z.string().uuid() })),
		jsonValidator(approveSalaryAdvanceSchema),
		async (c) => {
			try {
				const userId = c.get("user")?.id as string;
				const { id } = c.req.valid("param");
				const { approvedAmount } = c.req.valid("json");
				const advance = await payrollService.approveSalaryAdvance(
					id,
					userId,
					approvedAmount,
				);
				return c.json(createSuccessResponse(advance));
			} catch (error) {
				return handleRouteError(c, error, "approve salary advance");
			}
		},
	)

	.post(
		"/salary-advances/:id/disburse",
		hasOrgPermission("salary_advance:disburse"),
		paramValidator(z.object({ id: z.string().uuid() })),
		async (c) => {
			try {
				const { id } = c.req.valid("param");
				const advance = await payrollService.disburseSalaryAdvance(id);
				return c.json(createSuccessResponse(advance));
			} catch (error) {
				return handleRouteError(c, error, "disburse salary advance");
			}
		},
	)

	.get("/employees", hasOrgPermission("employee:read"), async (c) => {
		try {
			const activeOrgId = validateOrgId(
				c.get("session")?.activeOrganizationId as string,
			);
			const employees = await payrollService.getEmployees(activeOrgId);
			return c.json(createSuccessResponse(employees));
		} catch (error) {
			return handleRouteError(c, error, "fetch employees");
		}
	})

	.get("/payroll-runs", hasOrgPermission("payroll:read"), async (c) => {
		try {
			const activeOrgId = validateOrgId(
				c.get("session")?.activeOrganizationId as string,
			);
			const runs = await payrollService.getPayrollRuns(activeOrgId);
			return c.json(createSuccessResponse(runs));
		} catch (error) {
			return handleRouteError(c, error, "fetch payroll runs");
		}
	})

	.put(
		"/employees/:id",
		hasOrgPermission("employee:update"),
		paramValidator(z.object({ id: z.string().uuid() })),
		jsonValidator(updateEmployeeSchema),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const user = c.get("user") as User;
				const { id } = c.req.valid("param");
				const data = c.req.valid("json");
				const employee = await payrollService.updateEmployee(
					activeOrgId,
					id,
					data,
					user,
				);
				return c.json(createSuccessResponse(employee));
			} catch (error) {
				return handleRouteError(c, error, "update employee");
			}
		},
	)

	/**
	 * SALARY COMPONENTS ROUTES
	 */
	.post(
		"/salary-components",
		hasOrgPermission("salary_component:create"),
		jsonValidator(createSalaryComponentSchema),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const userId = c.get("user")?.id as string;
				const data = c.req.valid("json");
				const component = await payrollService.createSalaryComponent(
					activeOrgId,
					{
						...data,
						createdBy: userId,
					},
				);
				return c.json(createSuccessResponse(component), 201);
			} catch (error) {
				return handleRouteError(c, error, "create salary component");
			}
		},
	)

	.get(
		"/salary-components",
		hasOrgPermission("salary_component:read"),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const components =
					await payrollService.getSalaryComponents(activeOrgId);
				return c.json(createSuccessResponse(components));
			} catch (error) {
				return handleRouteError(c, error, "fetch salary components");
			}
		},
	)

	.put(
		"/salary-components/:id",
		hasOrgPermission("salary_component:update"),
		paramValidator(z.object({ id: z.string().uuid() })),
		jsonValidator(createSalaryComponentSchema.partial()),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const user = c.get("user") as User;
				const { id } = c.req.valid("param");
				const data = c.req.valid("json");
				const component = await payrollService.updateSalaryComponent(
					activeOrgId,
					id,
					data,
					user,
				);
				return c.json(createSuccessResponse(component));
			} catch (error) {
				return handleRouteError(c, error, "update salary component");
			}
		},
	)

	.delete(
		"/salary-components/:id",
		hasOrgPermission("salary_component:delete"),
		paramValidator(z.object({ id: z.string().uuid() })),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const user = c.get("user") as User;
				const { id } = c.req.valid("param");
				await payrollService.deleteSalaryComponent(activeOrgId, id, user);
				return c.json(
					createSuccessResponse({
						message: "Salary component deleted successfully",
					}),
				);
			} catch (error) {
				return handleRouteError(c, error, "delete salary component");
			}
		},
	)

	/**
	 * SALARY STRUCTURES ROUTES
	 */
	.post(
		"/salary-structures",
		hasOrgPermission("salary_structure:create"),
		jsonValidator(createSalaryStructureSchema),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const user = c.get("user") as User;
				const data = c.req.valid("json");

				// Fetch components to get their type
				const allComponents =
					await payrollService.getSalaryComponents(activeOrgId);
				const componentsMap = new Map(allComponents.map((c) => [c.id, c]));

				const salaryComponents = data.components.map((comp) => {
					const def = componentsMap.get(comp.componentId);
					if (!def) {
						throw new Error(`Component ${comp.componentId} not found`);
					}
					return {
						componentId: comp.componentId,
						amount: comp.amount || 0,
						type: def.componentType as "earning" | "deduction",
					};
				});

				const employee = await payrollService.updateEmployee(
					activeOrgId,
					data.employeeId,
					{
						baseSalary: data.baseSalary,
						currency: data.currency,
						paymentFrequency: data.paymentFrequency,
						salaryComponents,
					},
					user,
				);
				return c.json(createSuccessResponse(employee), 201);
			} catch (error) {
				return handleRouteError(c, error, "create salary structure");
			}
		},
	)

	.get(
		"/salary-structures",
		hasOrgPermission("salary_structure:read"),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const employees = await payrollService.getEmployees(activeOrgId);
				// Map to "Structure" shape expected by frontend table
				const structures = employees.map((emp) => ({
					id: emp.id,
					employee: {
						id: emp.id,
						employeeCode: emp.employeeCode,
						firstName: emp.firstName,
						lastName: emp.lastName,
					},
					baseSalary: emp.baseSalary,
					currency: emp.currency,
					paymentFrequency: emp.paymentFrequency,
					effectiveFrom: new Date().toISOString(),
					isActive: emp.status === "active",
					components: emp.salaryComponents,
				}));
				return c.json(createSuccessResponse(structures));
			} catch (error) {
				return handleRouteError(c, error, "fetch salary structures");
			}
		},
	)

	/**
	 * SALARY ADVANCE QUERIES
	 */
	.get(
		"/salary-advances",
		hasOrgPermission("salary_advance:read"),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const employeeId = c.req.query("employeeId");
				const advances = await payrollService.getSalaryAdvances(
					activeOrgId,
					employeeId,
				);
				return c.json(createSuccessResponse(advances));
			} catch (error) {
				return handleRouteError(c, error, "fetch salary advances");
			}
		},
	)

	/**
	 * PAYROLL RUN DETAILS
	 */
	.get(
		"/payroll-runs/:id/details",
		hasOrgPermission("payroll:read"),
		paramValidator(z.object({ id: z.string().uuid() })),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { id } = c.req.valid("param");
				const includeEntries = c.req.query("includeEntries") !== "false";
				const details = await payrollService.getPayrollRunDetails(
					activeOrgId,
					id,
					includeEntries,
				);
				return c.json(createSuccessResponse(details));
			} catch (error) {
				return handleRouteError(c, error, "fetch payroll run details");
			}
		},
	)

	/**
	 * PROCESS PAYMENT
	 */
	.post(
		"/entries/process-payment",
		hasOrgPermission("payroll:process_payment"),
		jsonValidator(processPayrollPaymentsSchema),
		async (c) => {
			try {
				const data = c.req.valid("json");
				const result = await payrollService.processPayrollPayments(
					data.entryIds,
				);
				return c.json(createSuccessResponse(result));
			} catch (error) {
				return handleRouteError(c, error, "process payroll payments");
			}
		},
	)
	.patch(
		"/payroll-runs/:runId/entries/:entryId",
		hasOrgPermission("payroll:update"),
		paramValidator(
			z.object({ runId: z.string().uuid(), entryId: z.string().uuid() }),
		),
		jsonValidator(updatePayrollEntrySchema),
		async (c) => {
			try {
				const activeOrgId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { runId, entryId } = c.req.valid("param");
				const { adjustments } = c.req.valid("json");
				const result = await payrollService.updatePayrollEntry(
					activeOrgId,
					runId,
					entryId,
					adjustments,
				);
				return c.json(createSuccessResponse(result));
			} catch (error) {
				return handleRouteError(c, error, "update payroll entry");
			}
		},
	);
