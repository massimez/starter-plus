"use client";

import { Button } from "@workspace/ui/components/button";

import type { FlattenedInventoryItem } from "./inventory-list";

interface StockDataRowProps {
	item: FlattenedInventoryItem;
	onAddTransaction: (variantId: string) => void;
	isVariantRow?: boolean;
}

export const StockDataRow = ({
	item,
	// onAddBatch,
	onAddTransaction,
	isVariantRow = false,
}: StockDataRowProps) => {
	const stockData = item.variant.stock;

	if (isVariantRow) {
		return (
			<div className="flex items-center justify-between border-b px-4 py-2 transition-colors last:border-b-0 hover:bg-muted/30">
				<div className="flex-1">
					<div className="text-sm">
						<span className="font-medium">{item.variantSku}</span>
						{item.variant.translations?.[0]?.name && (
							<span className="ml-2 text-muted-foreground">
								({item.variant.translations[0].name})
							</span>
						)}
					</div>
				</div>

				<div className="flex items-center gap-4">
					<div className="text-right text-sm">
						{stockData ? (
							<>
								<div className="font-medium">{stockData.quantity}</div>
								{stockData.reservedQuantity > 0 && (
									<div className="text-muted-foreground text-xs">
										({stockData.reservedQuantity} reserved)
									</div>
								)}
							</>
						) : (
							<span className="text-muted-foreground">0</span>
						)}
					</div>

					<div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => onAddTransaction(item.productVariantId)}
						>
							Add Transaction
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex items-center justify-between border-b p-4">
			<div className="flex flex-1 items-center gap-4">
				<div className="font-medium">{item.productName}</div>
				<div className="text-muted-foreground">{item.variantSku}</div>
			</div>

			<div className="flex items-center gap-4">
				<div className="text-right">
					{stockData ? (
						<div className="flex items-center gap-2">
							<span className="font-medium">{stockData.quantity}</span>
							{stockData.reservedQuantity > 0 && (
								<span className="text-muted-foreground text-sm">
									({stockData.reservedQuantity} reserved)
								</span>
							)}
						</div>
					) : (
						<span className="text-muted-foreground text-sm">0</span>
					)}
				</div>

				<div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onAddTransaction(item.productVariantId)}
					>
						Add Transaction
					</Button>
				</div>
			</div>
		</div>
	);
};
