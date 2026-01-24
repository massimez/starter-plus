import type { FieldValues } from "react-hook-form";
import {
	DEFAULT_GRID_COLS,
	FOCUS_ERROR_DELAY,
	MAX_GRID_COLS,
} from "./constants";
import type { FormBuilderItem, FormFieldConfig } from "./types";

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

export const focusFirstError = (): void => {
	setTimeout(() => {
		const firstErrorElement = document.querySelector(
			"[data-invalid]",
		) as HTMLElement;
		firstErrorElement?.focus();
	}, FOCUS_ERROR_DELAY);
};

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

export const convertLegacyFieldsToItems = <T extends FieldValues>(
	items?: FormBuilderItem<T>[],
	fields?: FormFieldConfig<T>[],
): FormBuilderItem<T>[] => {
	if (items) return items;
	if (fields) {
		return fields.map((field) => ({ itemType: "field" as const, ...field }));
	}
	return [];
};

// ============================================================================
// GRID LAYOUT UTILITIES
// ============================================================================

export const groupItemsIntoRows = <T extends FieldValues>(
	items: FormBuilderItem<T>[],
): FormBuilderItem<T>[][] => {
	const rows: FormBuilderItem<T>[][] = [];
	let currentRow: FormBuilderItem<T>[] = [];
	let currentRowCols = 0;

	items.forEach((item) => {
		const itemCols = item.gridCols || DEFAULT_GRID_COLS;

		// Start new row if adding this item would exceed max columns
		if (currentRowCols + itemCols > MAX_GRID_COLS) {
			if (currentRow.length > 0) {
				rows.push(currentRow);
				currentRow = [];
				currentRowCols = 0;
			}
		}

		currentRow.push(item);
		currentRowCols += itemCols;

		// Complete row if we've reached max columns
		if (currentRowCols === MAX_GRID_COLS) {
			rows.push(currentRow);
			currentRow = [];
			currentRowCols = 0;
		}
	});

	// Add any remaining items as the last row
	if (currentRow.length > 0) {
		rows.push(currentRow);
	}

	return rows;
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export const getFieldNamesFromItems = <T extends FieldValues>(
	items: FormBuilderItem<T>[],
): string[] => {
	return items
		.filter(
			(item): item is FormBuilderItem<T> & { itemType: "field" } =>
				item.itemType === "field",
		)
		.map((field) => field.name as string);
};

export const hasFieldErrors = (
	// biome-ignore lint/suspicious/noExplicitAny: <>
	errors: Record<string, any>,
	fieldPath: string,
): boolean => {
	const pathArray = fieldPath.split(".");
	// biome-ignore lint/suspicious/noExplicitAny: <>
	return pathArray.reduce((obj: any, key) => obj?.[key], errors) !== undefined;
};

// ============================================================================
// FORM UTILITIES
// ============================================================================

export const generateUniqueKey = (): string => {
	return `form-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const getItemKey = <T extends FieldValues>(
	item: FormBuilderItem<T>,
): string => {
	return item.itemType === "field" ? item.name.toString() : item.slotId;
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

export const isFieldItem = <T extends FieldValues>(
	item: FormBuilderItem<T>,
): item is FormBuilderItem<T> & { itemType: "field" } => {
	return item.itemType === "field";
};

export const isSlotItem = <T extends FieldValues>(
	item: FormBuilderItem<T>,
): item is FormBuilderItem<T> & { itemType: "slot" } => {
	return item.itemType === "slot";
};
