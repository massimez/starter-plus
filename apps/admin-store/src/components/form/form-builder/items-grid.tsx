"use client";

import React from "react";
import type { Control, FieldValues, UseFormSetValue } from "react-hook-form";
import { DEFAULT_GRID_COLS, GRID_COL_SPAN_MAP } from "./constants";
import { FieldRenderer } from "./field-renderer";
import { SlotRenderer } from "./slot-renderer";
import type {
	FormBuilderItem,
	FormFieldConfig,
	ItemsGridProps,
	SlotComponent,
	SlotConfig,
} from "./types";
import { getItemKey, groupItemsIntoRows } from "./utils";

// ============================================================================
// ITEMS GRID COMPONENT
// ============================================================================

export const ItemsGrid = React.memo(
	<T extends FieldValues>({
		items,
		control,
		config,
		setValue,
		formValues,
		t,
	}: ItemsGridProps<T>) => {
		const renderItem = (item: FormBuilderItem<T>) => {
			if (item.itemType === "field") {
				return (
					<FieldRenderer
						key={item.name.toString()}
						field={item as FormFieldConfig<FieldValues>}
						control={control as Control<FieldValues>}
						t={t}
					/>
				);
			}
			return (
				<SlotRenderer
					key={item.slotId}
					slot={item as SlotConfig<FieldValues>}
					globalSlots={
						config.slots as
							| Record<string, SlotComponent<FieldValues>>
							| undefined
					}
					setValue={setValue as UseFormSetValue<FieldValues>}
					formValues={formValues}
					t={t}
				/>
			);
		};

		// Simple vertical layout
		if (!config.gridLayout) {
			return <div className="space-y-6">{items.map(renderItem)}</div>;
		}

		// Grid layout with 12-column system
		const rows = groupItemsIntoRows(items);

		return (
			<div className="space-y-6">
				{rows.map((row, rowIndex) => (
					<div
						key={`row-${
							// biome-ignore lint/suspicious/noArrayIndexKey: <>
							rowIndex
						}`}
						className="grid grid-cols-1 gap-4 md:grid-cols-12"
					>
						{row.map((item) => {
							const colSpan =
								GRID_COL_SPAN_MAP[item.gridCols || DEFAULT_GRID_COLS];
							const key = getItemKey(item);

							return (
								<div key={key} className={colSpan}>
									{renderItem(item)}
								</div>
							);
						})}
					</div>
				))}
			</div>
		);
	},
);

ItemsGrid.displayName = "ItemsGrid";
