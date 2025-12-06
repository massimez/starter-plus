import type { ReactNode } from "react";

export default function FinancialLayout({ children }: { children: ReactNode }) {
	return <div className="flex flex-col gap-6">{children}</div>;
}
