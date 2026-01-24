"use client";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { X } from "lucide-react";

interface FinancialFilterBarProps {
	status: string | null;
	onStatusChange: (val: string | null) => void;
	from: string | null;
	onFromChange: (val: string | null) => void;
	to: string | null;
	onToChange: (val: string | null) => void;
	onClear: () => void;
	hasActiveFilters: boolean;
	children?: React.ReactNode;
}

export function FinancialFilterBar({
	status,
	onStatusChange,
	from,
	onFromChange,
	to,
	onToChange,
	onClear,
	hasActiveFilters,
	children,
}: FinancialFilterBarProps) {
	return (
		<div className="flex flex-wrap items-center gap-4">
			{children}
			<Select
				value={status || undefined}
				onValueChange={(val) => onStatusChange(val || null)}
			>
				<SelectTrigger className="w-[150px]">
					<SelectValue placeholder="Status" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="draft">Draft</SelectItem>
					<SelectItem value="sent">Sent</SelectItem>
					<SelectItem value="paid">Paid</SelectItem>
					<SelectItem value="partial">Partial</SelectItem>
					<SelectItem value="overdue">Overdue</SelectItem>
					<SelectItem value="cancelled">Cancelled</SelectItem>
				</SelectContent>
			</Select>

			<div className="flex items-center gap-2">
				<Input
					type="date"
					value={from || ""}
					onChange={(e) => onFromChange(e.target.value || null)}
					className="w-auto"
				/>
				<span className="text-muted-foreground text-sm">to</span>
				<Input
					type="date"
					value={to || ""}
					onChange={(e) => onToChange(e.target.value || null)}
					className="w-auto"
				/>
			</div>

			{hasActiveFilters && (
				<Button
					variant="ghost"
					size="icon"
					onClick={onClear}
					title="Clear Filters"
				>
					<X className="h-4 w-4" />
				</Button>
			)}
		</div>
	);
}
