"use client";

import { Input } from "@workspace/ui/components/input";
import MultipleSelector from "@workspace/ui/components/multi-select";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import type React from "react";
import { useMemo } from "react";
import type { FormFieldConfig } from "./types";

// ============================================================================
// TEXT INPUT COMPONENT
// ============================================================================

export const TextInput: React.FC<{
	// biome-ignore lint/suspicious/noExplicitAny: <>
	field: FormFieldConfig<any>;
	// biome-ignore lint/suspicious/noExplicitAny: <>
	fieldProps: any;
	t: (key: string) => string;
}> = ({ field, fieldProps, t }) => (
	<Input
		type={field.type}
		name={fieldProps.name}
		value={fieldProps.value}
		onChange={(e) => {
			let value: string | number = e.target.value;

			if (e.target.type === "number") {
				value = e.target.valueAsNumber;
			}

			const transformed = field.transformValue?.fromForm?.(value) ?? value;
			fieldProps.onChange(transformed);
		}}
		onBlur={fieldProps.onBlur}
		ref={fieldProps.ref}
		placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
	/>
);

// ============================================================================
// TEXTAREA INPUT COMPONENT
// ============================================================================

// biome-ignore lint/suspicious/noExplicitAny: <>
export const TextareaInput: React.FC<{ fieldProps: any }> = ({
	fieldProps,
}) => <Textarea {...fieldProps} />;

// ============================================================================
// SELECT INPUT COMPONENT
// ============================================================================

export const SelectInput: React.FC<{
	// biome-ignore lint/suspicious/noExplicitAny: <>
	field: FormFieldConfig<any>;
	// biome-ignore lint/suspicious/noExplicitAny: <>
	fieldProps: any;
	t: (key: string) => string;
}> = ({ field, fieldProps, t }) => (
	<Select
		onValueChange={fieldProps.onChange}
		value={String(fieldProps.value ?? "")}
	>
		<SelectTrigger className="w-full">
			<SelectValue
				placeholder={field.placeholderKey ? t(field.placeholderKey) : ""}
			/>
		</SelectTrigger>
		<SelectContent>
			{field.options?.map((option) => (
				<SelectItem key={option.value} value={option.value.toString()}>
					{option.label}
				</SelectItem>
			))}
		</SelectContent>
	</Select>
);

// ============================================================================
// MULTI-SELECT INPUT COMPONENT
// ============================================================================

export const MultiSelectInput: React.FC<{
	// biome-ignore lint/suspicious/noExplicitAny: <>
	field: FormFieldConfig<any>;
	// biome-ignore lint/suspicious/noExplicitAny: <>
	fieldProps: any;
	t: (key: string) => string;
}> = ({ field, fieldProps, t }) => {
	const selectedValues = fieldProps.value || [];

	const selectedOptions = useMemo(
		() =>
			field.options
				?.filter((option) => selectedValues.includes(option.value.toString()))
				.map((option) => ({
					...option,
					value: option.value.toString(),
				})) || [],
		[field.options, selectedValues],
	);

	const stringOptions = useMemo(
		() =>
			field.options?.map((option) => ({
				...option,
				value: option.value.toString(),
			})) || [],
		[field.options],
	);

	return (
		<MultipleSelector
			value={selectedOptions}
			options={stringOptions}
			placeholder={field.placeholderKey ? t(field.placeholderKey) : ""}
			onChange={(options) => {
				const values = options.map((option) => option.value);
				fieldProps.onChange(values);
			}}
		/>
	);
};

// ============================================================================
// SWITCH INPUT COMPONENT
// ============================================================================

// biome-ignore lint/suspicious/noExplicitAny: <>
export const SwitchInput: React.FC<{ fieldProps: any }> = ({ fieldProps }) => (
	<Switch
		checked={fieldProps.value || false}
		onCheckedChange={fieldProps.onChange}
	/>
);

// ============================================================================
// JSON INPUT COMPONENT
// ============================================================================

// biome-ignore lint/suspicious/noExplicitAny: <>
export const JsonInput: React.FC<{ fieldProps: any }> = ({ fieldProps }) => (
	<Textarea
		{...fieldProps}
		onChange={(e) => {
			fieldProps.onChange(e.target.value);
		}}
	/>
);

// ============================================================================
// CUSTOM INPUT ERROR COMPONENT
// ============================================================================

export const CustomFieldError: React.FC<{ fieldName: string }> = ({
	fieldName,
}) => (
	<div className="text-destructive">
		Custom renderer not found for field: {fieldName}
	</div>
);
