import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

export function useFinancialPayroll() {
	const queryClient = useQueryClient();

	const usePayrollRuns = () => {
		return useQuery({
			queryKey: ["financial", "payroll-runs"],
			queryFn: async () => {
				const res = await hc.api.financial.payroll["payroll-runs"].$get();
				const json = await res.json();
				return json.data;
			},
		});
	};

	const useEmployees = () => {
		return useQuery({
			queryKey: ["financial", "employees"],
			queryFn: async () => {
				const res = await hc.api.financial.payroll.employees.$get();
				const json = await res.json();
				return json.data;
			},
		});
	};

	const useCreatePayrollRun = () => {
		return useMutation({
			mutationFn: async (data: {
				periodStart: string;
				periodEnd: string;
				paymentDate: string;
			}) => {
				const res = await hc.api.financial.payroll["payroll-runs"].$post({
					json: data as typeof data & {
						periodStart: Date;
						periodEnd: Date;
						paymentDate: Date;
					}, // Type assertion needed due to z.coerce.date() inference
				});
				const json = await res.json();
				return json.data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["financial", "payroll-runs"],
				});
			},
		});
	};

	const useCreateEmployee = () => {
		return useMutation({
			mutationFn: async (data: {
				employeeCode: string;
				firstName: string;
				lastName: string;
				email?: string;
				phone?: string;
				position?: string;
				hireDate: string;
				employmentType: "full_time" | "part_time" | "contract";
				taxId?: string;
				baseSalary?: string;
				currency?: string;
				paymentFrequency?: "monthly" | "bi_weekly" | "weekly";
			}) => {
				const res = await hc.api.financial.payroll.employees.$post({
					json: data as typeof data & {
						hireDate: Date;
					}, // Type assertion needed due to z.coerce.date() inference
				});
				const json = await res.json();
				return json.data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["financial", "employees"],
				});
			},
		});
	};

	const useUpdateEmployee = () => {
		return useMutation({
			mutationFn: async (data: {
				employeeId: string;
				data: {
					firstName?: string;
					lastName?: string;
					email?: string;
					phone?: string;
					position?: string;
					employmentType?: "full_time" | "part_time" | "contract";
					taxId?: string;
					status?: "active" | "on_leave" | "terminated";
				};
			}) => {
				const res = await hc.api.financial.payroll.employees[":id"].$put({
					param: { id: data.employeeId },
					json: data.data,
				});
				const json = await res.json();
				return json.data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["financial", "employees"],
				});
			},
		});
	};

	const useSalaryComponents = () => {
		return useQuery({
			queryKey: ["financial", "salary-components"],
			queryFn: async () => {
				const res = await hc.api.financial.payroll["salary-components"].$get();
				const json = await res.json();
				return json.data;
			},
		});
	};

	const useSalaryStructures = () => {
		return useQuery({
			queryKey: ["financial", "salary-structures"],
			queryFn: async () => {
				// biome-ignore lint/suspicious/noExplicitAny: Hono RPC dynamic route workaround
				const res = await (hc.api.financial.payroll as any)[
					"salary-structures"
				].$get();
				const json = await res.json();
				return json.data;
			},
		});
	};

	const useCreateSalaryComponent = () => {
		return useMutation({
			mutationFn: async (data: {
				name: string;
				componentType: "earning" | "deduction";
				calculationType: "fixed" | "percentage" | "formula";
				accountId: string;
				isTaxable: boolean;
			}) => {
				const res = await hc.api.financial.payroll["salary-components"].$post({
					json: data,
				});
				const json = await res.json();
				return json.data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["financial", "salary-components"],
				});
			},
		});
	};

	const useUpdateSalaryComponent = () => {
		return useMutation({
			mutationFn: async (data: {
				id: string;
				data: {
					name?: string;
					componentType?: "earning" | "deduction";
					accountId?: string;
					isTaxable?: boolean;
				};
			}) => {
				// biome-ignore lint/suspicious/noExplicitAny: Hono RPC dynamic route workaround
				const res = await (hc.api.financial.payroll as any)[
					"salary-components"
				][":id"].$put({
					param: { id: data.id },
					json: data.data,
				});
				const json = await res.json();
				return json.data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["financial", "salary-components"],
				});
			},
		});
	};

	const useDeleteSalaryComponent = () => {
		return useMutation({
			mutationFn: async (id: string) => {
				// biome-ignore lint/suspicious/noExplicitAny: Hono RPC dynamic route workaround
				const res = await (hc.api.financial.payroll as any)[
					"salary-components"
				][":id"].$delete({
					param: { id },
				});
				const json = await res.json();
				return json.data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["financial", "salary-components"],
				});
			},
		});
	};

	const useCreateSalaryStructure = () => {
		return useMutation({
			mutationFn: async (data: {
				employeeId: string;
				effectiveFrom: string;
				baseSalary: number | string;
				currency: string;
				paymentFrequency: "monthly" | "bi_weekly" | "weekly";
				components: {
					componentId: string;
					amount?: number;
					percentage?: number;
					calculationBasis?: "base_salary" | "gross_salary";
				}[];
			}) => {
				// biome-ignore lint/suspicious/noExplicitAny: Hono RPC dynamic route workaround
				const res = await (hc.api.financial.payroll as any)[
					"salary-structures"
				].$post({
					json: {
						...data,
						baseSalary: String(data.baseSalary),
					} as typeof data & {
						baseSalary: string;
						effectiveFrom: Date;
					}, // Type assertion to satisfy RPC if it wasn't any, but keeping for safety/consistency
				});
				const json = await res.json();
				return json.data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["financial", "salary-structures"],
				});
				queryClient.invalidateQueries({
					queryKey: ["financial", "employees"],
				});
			},
		});
	};

	const usePayrollRunDetails = (runId: string) => {
		return useQuery({
			queryKey: ["financial", "payroll-run-details", runId],
			queryFn: async () => {
				const res = await hc.api.financial.payroll["payroll-runs"][
					":id"
				].details.$get({
					param: { id: runId },
				});
				const json = await res.json();
				return json.data;
			},
			enabled: !!runId,
		});
	};

	const useCalculatePayroll = () => {
		return useMutation({
			mutationFn: async (runId: string) => {
				const res = await hc.api.financial.payroll["payroll-runs"][
					":id"
				].calculate.$post({
					param: { id: runId },
				});
				const json = await res.json();
				return json.data;
			},
			onSuccess: (_, runId) => {
				queryClient.invalidateQueries({
					queryKey: ["financial", "payroll-runs"],
				});
				queryClient.invalidateQueries({
					queryKey: ["financial", "payroll-run-details", runId],
				});
			},
		});
	};

	const useApprovePayrollRun = () => {
		return useMutation({
			mutationFn: async (runId: string) => {
				const res = await hc.api.financial.payroll["payroll-runs"][
					":id"
				].approve.$post({
					param: { id: runId },
				});
				const json = await res.json();
				return json.data;
			},
			onSuccess: (_, runId) => {
				queryClient.invalidateQueries({
					queryKey: ["financial", "payroll-runs"],
				});
				queryClient.invalidateQueries({
					queryKey: ["financial", "payroll-run-details", runId],
				});
			},
		});
	};

	const useProcessPayrollPayments = () => {
		return useMutation({
			mutationFn: async (data: { entryIds: string[] }) => {
				const res = await hc.api.financial.payroll.entries[
					"process-payment"
				].$post({
					json: data,
				});
				const json = await res.json();
				return json.data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["financial", "payroll-runs"],
				});
			},
		});
	};

	const useDeletePayrollRun = () => {
		return useMutation({
			mutationFn: async (runId: string) => {
				const res = await hc.api.financial.payroll["payroll-runs"][
					":id"
				].$delete({
					param: { id: runId },
				});
				const json = await res.json();
				return json.data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["financial", "payroll-runs"],
				});
			},
		});
	};

	const useSalaryAdvances = (employeeId?: string) => {
		return useQuery({
			queryKey: ["financial", "salary-advances", employeeId],
			queryFn: async () => {
				const res = await hc.api.financial.payroll["salary-advances"].$get({
					query: { employeeId },
				});
				const json = await res.json();
				return json.data;
			},
		});
	};

	const useRequestSalaryAdvance = () => {
		return useMutation({
			mutationFn: async (data: {
				employeeId: string;
				amount: number;
				installments: number;
				notes?: string;
			}) => {
				const res = await hc.api.financial.payroll["salary-advances"].$post({
					json: data,
				});
				const json = await res.json();
				return json.data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["financial", "salary-advances"],
				});
			},
		});
	};

	const useApproveSalaryAdvance = () => {
		return useMutation({
			mutationFn: async (data: { id: string; approvedAmount: number }) => {
				const res = await hc.api.financial.payroll["salary-advances"][
					":id"
				].approve.$post({
					param: { id: data.id },
					json: { approvedAmount: data.approvedAmount },
				});
				const json = await res.json();
				return json.data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["financial", "salary-advances"],
				});
				queryClient.invalidateQueries({
					queryKey: ["financial", "payroll-runs"],
				});
			},
		});
	};

	const useDisburseSalaryAdvance = () => {
		return useMutation({
			mutationFn: async (id: string) => {
				const res = await hc.api.financial.payroll["salary-advances"][
					":id"
				].disburse.$post({
					param: { id },
				});
				const json = await res.json();
				return json.data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["financial", "salary-advances"],
				});
				queryClient.invalidateQueries({
					queryKey: ["financial", "payroll-runs"],
				});
			},
		});
	};

	const useUpdatePayrollEntry = (runId: string) => {
		return useMutation({
			mutationFn: async (data: {
				entryId: string;
				adjustments: Array<{
					id: string;
					name: string;
					type: "earning" | "deduction";
					amount: number;
					notes?: string;
				}>;
			}) => {
				// biome-ignore lint/suspicious/noExplicitAny: Hono RPC dynamic route workaround
				const res = await (hc.api.financial.payroll["payroll-runs"] as any)[
					":runId"
				].entries[":entryId"].$patch({
					param: { runId, entryId: data.entryId },
					json: { adjustments: data.adjustments },
				});
				const json = await res.json();
				return json.data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["financial", "payroll-run-details", runId],
				});
				queryClient.invalidateQueries({
					queryKey: ["financial", "payroll-runs"],
				});
			},
		});
	};

	return {
		usePayrollRuns,
		useEmployees,
		useCreatePayrollRun,
		useDeletePayrollRun,
		useCreateEmployee,
		useUpdateEmployee,
		useCreateSalaryStructure,
		useSalaryComponents,
		useSalaryStructures,
		useCreateSalaryComponent,
		useUpdateSalaryComponent,
		useDeleteSalaryComponent,
		usePayrollRunDetails,
		useCalculatePayroll,
		useApprovePayrollRun,
		useProcessPayrollPayments,
		useSalaryAdvances,
		useRequestSalaryAdvance,
		useApproveSalaryAdvance,
		useDisburseSalaryAdvance,
		useUpdatePayrollEntry,
	};
}
