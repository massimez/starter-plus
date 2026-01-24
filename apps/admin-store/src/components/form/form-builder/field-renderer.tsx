"use client";

import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@workspace/ui/components/form";
import React from "react";
import { type FieldValues, useWatch } from "react-hook-form";
import { SWITCH_CONTAINER_CLASS, SWITCH_LABEL_CLASS } from "./constants";
import {
	CustomFieldError,
	JsonInput,
	MultiSelectInput,
	SelectInput,
	SwitchInput,
	TextareaInput,
	TextInput,
} from "./field-inputs";
import type { FieldRendererProps } from "./types";

// ============================================================================
// FIELD RENDERER COMPONENT
// ============================================================================

export const FieldRenderer = React.memo(
	<T extends FieldValues>({ field, control, t }: FieldRendererProps<T>) => {
		const values = useWatch({ control }) as T;

		// Early return for conditional rendering
		if (field.conditionalRender && !field.conditionalRender(values)) {
			return null;
		}

		// biome-ignore lint/suspicious/noExplicitAny: <>
		const renderInput = (fieldProps: any) => {
			switch (field.type) {
				case "textarea":
					return <TextareaInput fieldProps={fieldProps} />;

				case "select":
					return <SelectInput field={field} fieldProps={fieldProps} t={t} />;

				case "multiselect":
					return (
						<MultiSelectInput field={field} fieldProps={fieldProps} t={t} />
					);

				case "switch":
					return <SwitchInput fieldProps={fieldProps} />;

				case "json":
					return <JsonInput fieldProps={fieldProps} />;

				case "custom": {
					const CustomComponent = field.customRenderer;
					if (!CustomComponent) {
						console.warn(
							`Custom field renderer not found for field: ${field.name}`,
						);
						return <CustomFieldError fieldName={field.name.toString()} />;
					}

					return (
						<CustomComponent
							field={field}
							control={control}
							value={fieldProps.value}
							onChange={fieldProps.onChange}
							onBlur={fieldProps.onBlur}
							name={fieldProps.name}
							t={t}
							formValues={values}
							{...(field.customProps || {})}
						/>
					);
				}

				default:
					return <TextInput field={field} fieldProps={fieldProps} t={t} />;
			}
		};

		const getItemClassName = (): string => {
			if (field.type === "switch") {
				return SWITCH_CONTAINER_CLASS;
			}
			if (field.type === "custom" && field.customProps?.containerClassName) {
				return field.customProps.containerClassName;
			}
			return "";
		};

		const getLabelClassName = (): string => {
			return field.type === "switch" ? SWITCH_LABEL_CLASS : "";
		};

		return (
			<FormField
				control={control}
				name={field.name}
				render={({ field: fieldProps }) => (
					<FormItem className={getItemClassName()}>
						<div className={getLabelClassName()}>
							<FormLabel>
								{t(field.labelKey)}
								{field.required && (
									<span className="ml-1 text-destructive">*</span>
								)}
							</FormLabel>
							{field.descriptionKey && (
								<FormDescription>{t(field.descriptionKey)}</FormDescription>
							)}
						</div>
						<FormControl>
							{renderInput({
								...fieldProps,
								placeholder: field.placeholderKey
									? t(field.placeholderKey)
									: undefined,
							})}
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	},
);

FieldRenderer.displayName = "FieldRenderer";
