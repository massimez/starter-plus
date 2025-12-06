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
				bankAccountNumber?: string;
				taxId?: string;
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
					bankAccountNumber?: string;
					taxId?: string;
					status?: "active" | "on_leave" | "terminated";
				};
			}) => {
				const res = await (hc.api.financial.payroll["employees"] as any)[
					data.employeeId
				].$put({
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
				componentType: "earning" | "deduction" | "employer_contribution";
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

	const useCreateSalaryStructure = () => {
		return useMutation({
			mutationFn: async (data: {
				employeeId: string;
				effectiveFrom: string;
				baseSalary: number;
				currency: string;
				paymentFrequency: "monthly" | "bi_weekly" | "weekly";
				components: {
					componentId: string;
					amount?: number;
					percentage?: number;
					calculationBasis?: "base_salary" | "gross_salary";
				}[];
			}) => {
				const res = await hc.api.financial.payroll["salary-structures"].$post({
					json: data as typeof data & {
						effectiveFrom: Date;
					}, // Type assertion needed due to z.coerce.date() inference
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
				const res = await (hc.api.financial.payroll["payroll-runs"] as any)[
					runId
				].details.$get();
				const json = await res.json();
				return json.data;
			},
			enabled: !!runId,
		});
	};

	const useCalculatePayroll = () => {
		return useMutation({
			mutationFn: async (runId: string) => {
				const res = await (hc.api.financial.payroll["payroll-runs"] as any)[
					runId
				].calculate.$post();
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
				const res = await (hc.api.financial.payroll["payroll-runs"] as any)[
					runId
				].approve.$post();
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
				const res = await hc.api.financial.payroll["entries"][
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
				const res = await (hc.api.financial.payroll["payroll-runs"] as any)[
					runId
				].$delete();
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
		usePayrollRunDetails,
		useCalculatePayroll,
		useApprovePayrollRun,
		useProcessPayrollPayments,
	};
}
