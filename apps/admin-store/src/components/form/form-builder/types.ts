/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
import type React from "react";
import type {
	Control,
	FieldValues,
	Path,
	UseFormSetValue,
} from "react-hook-form";
import type { ZodType } from "zod";

// ============================================================================
// CORE TYPES
// ============================================================================

export type FormFieldType =
	| "text"
	| "email"
	| "number"
	| "textarea"
	| "select"
	| "multiselect"
	| "switch"
	| "password"
	| "tel"
	| "url"
	| "json"
	| "custom";

export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface SelectOption {
	value: string | number;
	label: string;
	disable?: boolean;
	fixed?: boolean;
	helperText?: string;
}

export interface ValidationConfig {
	min?: number;
	max?: number;
	minLength?: number;
	maxLength?: number;
	pattern?: RegExp;
}

export interface ValueTransform {
	toForm: (value: any) => any;
	fromForm: (value: any) => any;
}

// ============================================================================
// CUSTOM FIELD TYPES
// ============================================================================

export interface CustomFieldProps<T extends FieldValues = FieldValues> {
	field: FormFieldConfig<T>;
	control: Control<T>;
	value: any;
	onChange: (value: any) => void;
	onBlur: () => void;
	name: string;
	t: (key: string) => string;
	formValues: T;
}

export type CustomFieldRenderer<T extends FieldValues = FieldValues> =
	React.ComponentType<CustomFieldProps<T>>;

// ============================================================================
// SLOT TYPES
// ============================================================================

export interface SlotProps<T extends FieldValues = FieldValues> {
	slotId: string;
	formValues: T;
	setValue: UseFormSetValue<T>;
	t: (key: string) => string;
	[key: string]: any;
}

export type SlotComponent<T extends FieldValues = FieldValues> =
	React.ComponentType<SlotProps<T>>;

export interface SlotConfig<T extends FieldValues = FieldValues> {
	slotId: string;
	component: SlotComponent<T> | React.ReactNode;
	gridCols?: GridColumns;
	conditionalRender?: (values: T) => boolean;
	className?: string;
	props?: Record<string, any>;
}

// ============================================================================
// FIELD CONFIGURATION
// ============================================================================

export interface FormFieldConfig<T extends FieldValues = FieldValues> {
	name: Path<T>;
	type: FormFieldType;
	labelKey: string;
	placeholderKey?: string;
	descriptionKey?: string;
	required?: boolean;
	options?: SelectOption[];
	gridCols?: GridColumns;
	validation?: ValidationConfig;
	conditionalRender?: (values: T) => boolean;
	transformValue?: ValueTransform;
	customRenderer?: CustomFieldRenderer<T>;
	customProps?: Record<string, any>;
	helperText?: string;
}

// ============================================================================
// FORM BUILDER ITEMS
// ============================================================================

export type FormBuilderItem<T extends FieldValues = FieldValues> =
	| ({ itemType: "field" } & FormFieldConfig<T>)
	| ({ itemType: "slot" } & SlotConfig<T>);

// ============================================================================
// TAB CONFIGURATION
// ============================================================================

export interface FormTabConfig<T extends FieldValues = FieldValues> {
	key: string;
	labelKey: string;
	descriptionKey?: string;
	items: FormBuilderItem<T>[];
	// Deprecated - use items instead
	fields?: FormFieldConfig<T>[];
}

// ============================================================================
// FORM BUILDER CONFIGURATION
// ============================================================================

export interface FormBuilderConfig<T extends FieldValues = FieldValues> {
	schema: ZodType<T, any, any>;
	defaultValues: Partial<T>;
	tabs?: FormTabConfig<T>[];
	items?: FormBuilderItem<T>[];
	// Deprecated - use items instead
	fields?: FormFieldConfig<T>[];
	submitButtonText?: string;
	validateOnTab?: boolean;
	gridLayout?: boolean;
	customFieldRenderers?: Record<string, CustomFieldRenderer<T>>;
	slots?: Record<string, SlotComponent<T>>;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface FormBuilderProps<T extends FieldValues> {
	config: FormBuilderConfig<T>;
	initialValues?: Partial<T>;
	onSubmit: (values: T) => Promise<void>;
	isSubmitting?: boolean;
	className?: string;
	mode?: "onBlur" | "onChange" | "onSubmit" | "all";
}

export interface FieldRendererProps<T extends FieldValues> {
	field: FormFieldConfig<T>;
	control: Control<T>;
	t: (key: string) => string;
}

export interface SlotRendererProps<T extends FieldValues> {
	slot: SlotConfig<T>;
	globalSlots?: Record<string, SlotComponent<FieldValues>>;
	formValues: T;
	setValue: UseFormSetValue<T>;
	t: (key: string) => string;
}

export interface ItemsGridProps<T extends FieldValues> {
	items: FormBuilderItem<T>[];
	control: Control<T>;
	setValue: UseFormSetValue<T>;
	config: FormBuilderConfig<T>;
	formValues: T;
	t: (key: string) => string;
}

export interface FormComponentProps<T extends FieldValues> {
	config: FormBuilderConfig<T>;
	form: any;
	handleSubmit: (values: T) => Promise<void>;
	isSubmitting: boolean;
	className: string;
	t: (key: string) => string;
}
