"use client";

import { useQuery } from "@tanstack/react-query";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { useActiveOrganization } from "@/app/[locale]/dashboard/organization/queries";
import { hc } from "@/lib/api-client";
import { formatCurrency as formatCurrencyHelper } from "@/lib/helpers";

type CurrencyContextType = {
	currency: string;
	setCurrency: (currency: string) => void;
	formatCurrency: (amount: number) => string;
	isLoading: boolean;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(
	undefined,
);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
	const [currency, setCurrency] = useState("USD");
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;

	const { data: orgInfo, isLoading } = useQuery({
		queryKey: ["organization", organizationId, "info"],
		queryFn: async () => {
			if (!organizationId) return null;
			const res = await hc.api.organizations.info.$get();
			if (res.ok) {
				const result = await res.json();
				if ("data" in result) {
					return result.data;
				}
			}
			return null;
		},
		enabled: !!organizationId,
		staleTime: 1000 * 60 * 5,
	});

	useEffect(() => {
		if (orgInfo?.currency) {
			setCurrency(orgInfo.currency);
		}
	}, [orgInfo]);

	const formatCurrency = useCallback(
		(amount: number) => {
			return formatCurrencyHelper(amount, currency);
		},
		[currency],
	);

	const value = {
		currency,
		setCurrency,
		formatCurrency,
		isLoading,
	};

	return (
		<CurrencyContext.Provider value={value}>
			{children}
		</CurrencyContext.Provider>
	);
}

export function useCurrency() {
	const context = useContext(CurrencyContext);
	if (context === undefined) {
		throw new Error("useCurrency must be used within a CurrencyProvider");
	}
	return context;
}
