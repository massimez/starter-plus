// Main component export

// Constant exports
export {
	DEFAULT_GRID_COLS,
	DEFAULT_NEXT_TEXT,
	DEFAULT_PREVIOUS_TEXT,
	DEFAULT_SUBMIT_BUTTON_TEXT,
	DEFAULT_SUBMITTING_TEXT,
	FOCUS_ERROR_DELAY,
	FORM_HEIGHT_CLASSES,
	GRID_COL_SPAN_MAP,
	MAX_GRID_COLS,
	SWITCH_CONTAINER_CLASS,
	SWITCH_LABEL_CLASS,
} from "./constants";
// Input component exports
export {
	CustomFieldError,
	JsonInput,
	MultiSelectInput,
	SelectInput,
	SwitchInput,
	TextareaInput,
	TextInput,
} from "./field-inputs";

// Component exports for advanced usage
export { FieldRenderer } from "./field-renderer";
export { ItemsGrid } from "./items-grid";
export { FormBuilder } from "./main";
export { SimpleForm } from "./simple-form";
export { SlotRenderer } from "./slot-renderer";
export { TabbedForm } from "./tabbed-form";
// Type exports
export type * from "./types";

// Hook exports
export { useTabManagement } from "./use-tab-management";
// Utility exports
export {
	convertLegacyFieldsToItems,
	focusFirstError,
	generateUniqueKey,
	getFieldNamesFromItems,
	getItemKey,
	groupItemsIntoRows,
	hasFieldErrors,
	isFieldItem,
	isSlotItem,
} from "./utils";
